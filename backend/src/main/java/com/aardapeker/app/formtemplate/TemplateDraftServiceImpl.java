package com.aardapeker.app.formtemplate;

import com.aardapeker.app.component.Component;
import com.aardapeker.app.component.ComponentField;
import com.aardapeker.app.component.ComponentService;
import com.aardapeker.app.customer.CustomerService;
import com.aardapeker.app.customer.CustomerSite;
import com.aardapeker.app.customer.CustomerSiteResponse;
import com.aardapeker.app.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Turns a technician's rough field notes into service form text, guided by the
 * breakdown template they picked. One stateless call per draft - no conversation
 * history is kept, and only the selected template is sent to the model.
 */
@Service
public class TemplateDraftServiceImpl implements TemplateDraftService {

    private static final Logger logger = LoggerFactory.getLogger(TemplateDraftServiceImpl.class);
    private static final String OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
    private static final int MAX_NOTES_LENGTH = 4000;
    private static final int MAX_CATALOGUE_ENTRIES = 120;
    private static final Locale TR = new Locale("tr", "TR");
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4}\\b");

    private static final String SYSTEM_PROMPT = """
            You write service report text for a CCTV and security systems company. A field \
            technician picked a service template and dictated rough notes. Rewrite those notes \
            into the company's standard service form wording.

            Reply with a single JSON object and nothing else. Keys: "faultDescription", \
            "serviceDescription", "deliveryNotes", "products", "customerHint".

            How each field is written on this company's forms:
            - "faultDescription" (ARIZA TANIMI) is a SHORT label, usually two to five words, \
            not a sentence. Examples: "Kamera arızası", "Bakım", "Hat kopması". Never write a \
            paragraph here.
            - "serviceDescription" (SERVİS AÇIKLAMASI) is the body: one to four sentences \
            describing what was found and what was done. Use formal, impersonal Turkish in the \
            past tense, the way a technician writes a report - "... arızalandığı tespit \
            edilmiştir", "... değiştirilerek tekrar çalıştırılmıştır", "... kontrol edildi". \
            State findings first, then the work performed.
            - "deliveryNotes" (AÇIKLAMALAR) is a short closing remark about the state the system \
            was left in, or anything left pending. Often a single sentence such as "Sistem \
            eksiksiz ve sorunsuz olarak çalışmaktadır." Leave it empty when the notes say \
            nothing about it.
            - "products" is an array of materials used or taken, each \
            {"component": string, "quantity": integer, "fields": {field name: value}}. Quantity \
            may be a piece count or a length in metres, whichever the notes imply. Use [] when \
            no material is mentioned.
            - Never put a brand or model into the component name. Copy the component name \
            exactly from the catalogue and put the brand and model in the fields: a camera \
            dictated as "dahua 1432" is {"component": "Kamera", "quantity": 1, "fields": \
            {"Marka": "Dahua", "Model": "1432"}}, never {"component": "Dahua 1432"}. Only use a \
            name outside the catalogue when the material genuinely is not listed there, and then \
            leave "fields" empty.
            - "customerHint" is the customer and site the technician named, copied verbatim, \
            e.g. {"name": "Barsan", "site": "Samandira"}. Use empty strings when not mentioned; \
            never guess a customer.

            House phrasing used on these forms - follow it closely:
            - Fault reports usually open with "Kurulu bulunan kamera sisteminin ..." and state \
            the finding with "... olduğu görülmüştür.", "... tespit edilmiştir." or \
            "... saptanmıştır.".
            - Work performed ends with "... yapılmıştır.", "... değiştirilerek tekrar \
            çalıştırılmıştır." or "... devreye alınmıştır.".
            - Identify cameras exactly the way the technician does: by number, IP address and \
            channel - e.g. "8 nolu 172.50.50.108 ip'li kamera", "192.168.1.62 nolu kameranın \
            (Kanal 6)", "Rampa 32 nolu kamera".
            - When the notes give an outage and restore time, write both: "... saat 11:10'da off \
            konuma geçmiştir. Devreye alındığı saat ise 17:45'dir." Always report both times when \
            the notes give them - an outage time is never dropped just because no date is \
            available. Add a date in front of a time ONLY when the notes give one, or when they \
            name a relative day you can resolve from the date list below; otherwise write the \
            time on its own and never pick a date to fill the pattern.
            - When the work could not be finished, say why and what happens next, e.g. \
            "İlgili bölgede malzeme olmaması sebebiyle müdahale edilememiştir. Malzemeler \
            alındığında yetkili kişi tarafımıza bilgi verecektir."
            - Faults found but not repaired go on their own line starting with "Not:".
            - When devices are replaced and the notes list their identities, write a block \
            "Yeni takılan kamera bilgileri:" followed by one line per device with number, IP \
            and serial number.
            - When equipment was removed and handed over, say so: "Sökülen 6 adet kamera depo \
            sorumlusuna teslim edilmiştir."
            - When the visit produced a quote instead of a repair, list the needed materials \
            under "Teklif için gerekli malzemeler:" as a numbered list.
            - Multiple independent findings are written as separate short lines, not merged \
            into one paragraph.
            - Keep any serial number, site/warehouse code or IP the notes mention, on its own \
            line at the end (e.g. "NVR SN: ...", "Bursa Antrepo Kodu = A00000001").
            - Closing remarks in "deliveryNotes" are usually "Sistem sorunsuz çalışmaktadır." \
            or "Sistem sorunsuz şekilde çalışır durumda teslim edilmiştir."

            Rules:
            - Never invent facts. Only state what the notes support. If the notes say nothing \
            about a field, return an empty string for it. Never invent camera numbers, IP \
            addresses, times or serial numbers.
            - The example texts below show WORDING ONLY. They describe a different job. Never \
            copy any date, time, IP address, camera number, serial number, quantity or site code \
            out of an example into your answer - every such detail must come from the \
            technician's notes.
            - Resolve relative days ("dün", "bugün", "önceki gün") against the service date \
            given below. Never supply a date the notes do not give or imply.
            - Do not add customer names, signatures, prices or filler sentences.
            - Not every form is a breakdown: installations, maintenance visits and material \
            pickups are written the same factual way.
            """;

    @Value("${openai.api-key:}")
    private String openaiApiKey;

    @Value("${openai.chat-model:gpt-4o-mini}")
    private String chatModel;

    private final ServiceFormTemplateService templateService;
    private final ComponentService componentService;
    private final CustomerService customerService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public TemplateDraftServiceImpl(
            ServiceFormTemplateService templateService,
            ComponentService componentService,
            CustomerService customerService,
            ObjectMapper objectMapper) {
        this.templateService = templateService;
        this.componentService = componentService;
        this.customerService = customerService;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Override
    @Transactional(readOnly = true)
    public TemplateDraftResponse draft(TemplateDraftRequest request) {
        if (openaiApiKey == null || openaiApiKey.isBlank()) {
            throw new BadRequestException("AI drafting is not configured on this server");
        }

        ServiceFormTemplate template = templateService.getById(request.templateId());
        String notes = request.notes().trim();
        if (notes.length() > MAX_NOTES_LENGTH) {
            notes = notes.substring(0, MAX_NOTES_LENGTH);
        }

        String content = callModel(buildUserPrompt(template, notes, request));
        JsonNode draft = parseJson(content);

        Set<String> allowedDates = allowedDates(notes, request.serviceDate());

        return new TemplateDraftResponse(
                scrubUnsupportedDates(draft.path("faultDescription").asText("").trim(), allowedDates),
                scrubUnsupportedDates(draft.path("serviceDescription").asText("").trim(), allowedDates),
                scrubUnsupportedDates(draft.path("deliveryNotes").asText("").trim(), allowedDates),
                resolveProducts(draft.path("products")),
                resolveCustomer(draft.path("customerHint")).orElse(null)
        );
    }

    private String buildUserPrompt(ServiceFormTemplate template, String notes, TemplateDraftRequest request) {
        boolean turkish = request.language() == null || request.language().toLowerCase().startsWith("tr");
        StringBuilder prompt = new StringBuilder();

        prompt.append("Write the output in ")
                .append(turkish ? "Turkish" : "English")
                .append(".\n\n");
        prompt.append("Breakdown template: ")
                .append(turkish ? template.getNameTr() : template.getNameEn())
                .append('\n');

        appendIfPresent(prompt, "What this breakdown type usually involves", template.getPromptHint());
        appendIfPresent(prompt, "Example fault description in house style", template.getFaultExample());
        appendIfPresent(prompt, "Example service description in house style", template.getServiceExample());

        List<String> componentNames = template.getSuggestedComponents().stream()
                .map(tc -> tc.getComponent().getName())
                .toList();
        if (!componentNames.isEmpty()) {
            prompt.append("Materials commonly used for this breakdown type (prefer these exact names when the notes mention them): ")
                    .append(String.join(", ", componentNames))
                    .append('\n');
        }

        appendDateContext(prompt, request.serviceDate());

        if (request.customerName() != null && !request.customerName().isBlank()) {
            prompt.append("Site/customer (context only, do not repeat it in the output): ")
                    .append(request.customerName().trim())
                    .append('\n');
        }

        appendCatalogue(prompt);

        prompt.append("\nTechnician's notes:\n\"\"\"\n").append(notes).append("\n\"\"\"");
        return prompt.toString();
    }

    private static void appendIfPresent(StringBuilder prompt, String label, String value) {
        if (value != null && !value.isBlank()) {
            prompt.append(label).append(":\n").append(value.trim()).append('\n');
        }
    }

    private String callModel(String userPrompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(openaiApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", chatModel,
                "temperature", 0.2,
                "max_tokens", 800,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", userPrompt)));

        try {
            ResponseEntity<OpenAiChatApiResponse> response = restTemplate.postForEntity(
                    OPENAI_CHAT_URL, new HttpEntity<>(body, headers), OpenAiChatApiResponse.class);

            OpenAiChatApiResponse result = response.getBody();
            if (result == null || result.choices() == null || result.choices().isEmpty()
                    || result.choices().get(0).message() == null) {
                throw new BadRequestException("AI draft request returned no content");
            }
            return result.choices().get(0).message().content();
        } catch (RestClientException e) {
            logger.error("OpenAI draft request failed: {}", e.getMessage());
            throw new BadRequestException("AI draft request failed: " + e.getMessage());
        }
    }

    private JsonNode parseJson(String content) {
        String cleaned = content == null ? "" : content.trim();
        // Guard against a model that wraps its JSON in a markdown fence anyway.
        if (cleaned.startsWith("```")) {
            int firstBreak = cleaned.indexOf('\n');
            int lastFence = cleaned.lastIndexOf("```");
            if (firstBreak > 0 && lastFence > firstBreak) {
                cleaned = cleaned.substring(firstBreak + 1, lastFence).trim();
            }
        }

        try {
            return objectMapper.readTree(cleaned);
        } catch (Exception e) {
            logger.error("Could not parse AI draft response as JSON: {}", e.getMessage());
            throw new BadRequestException("AI returned an unreadable draft, please try again");
        }
    }

    /**
     * Dates the draft is allowed to contain: any the technician wrote, plus the
     * three relative days we resolved for the model.
     */
    private static Set<String> allowedDates(String notes, String serviceDate) {
        Set<String> allowed = new HashSet<>();
        Matcher matcher = DATE_PATTERN.matcher(notes == null ? "" : notes);
        while (matcher.find()) {
            allowed.add(canonicalDate(matcher.group()));
        }

        if (serviceDate != null && !serviceDate.isBlank()) {
            try {
                LocalDate date = LocalDate.parse(serviceDate.trim());
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
                allowed.add(canonicalDate(date.format(formatter)));
                allowed.add(canonicalDate(date.minusDays(1).format(formatter)));
                allowed.add(canonicalDate(date.minusDays(2).format(formatter)));
            } catch (DateTimeParseException ignored) {
                // no date context to add
            }
        }
        return allowed;
    }

    /**
     * Removes any date the notes do not support. Models fill the "... tarihinde saat
     * X" pattern with a plausible-looking date even when told not to, and a wrong
     * date on a signed service form is worse than a slightly shorter sentence.
     */
    private static String scrubUnsupportedDates(String text, Set<String> allowed) {
        if (text.isEmpty()) return text;

        Matcher matcher = DATE_PATTERN.matcher(text);
        List<String> unsupported = new ArrayList<>();
        while (matcher.find()) {
            String found = matcher.group();
            if (!allowed.contains(canonicalDate(found))) {
                unsupported.add(found);
            }
        }
        if (unsupported.isEmpty()) return text;

        String cleaned = text;
        for (String date : unsupported) {
            String quoted = Pattern.quote(date);
            cleaned = cleaned.replaceAll(quoted + "\\s+tarihinde\\s+", "");
            cleaned = cleaned.replaceAll(quoted + "\\s+tarihli\\s+", "");
            cleaned = cleaned.replaceAll(quoted + "\\s*'?d[ae]\\s+", "");
            cleaned = cleaned.replaceAll(quoted, "");
            logger.warn("Removed unsupported date '{}' from AI draft", date);
        }
        return cleaned.replaceAll("[ \\t]{2,}", " ").replaceAll(" +([.,])", "$1").trim();
    }

    /** Normalises 8.9.26 / 08.09.2026 to one comparable form. */
    private static String canonicalDate(String date) {
        String[] parts = date.split("[./-]");
        if (parts.length != 3) return date;
        String year = parts[2].length() == 2 ? "20" + parts[2] : parts[2];
        return String.format("%02d.%02d.%s", Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), year);
    }

    /**
     * Spells out what each relative day actually is. Models are unreliable at date
     * arithmetic, so "dün" is resolved here and handed over as a literal fact.
     */
    private static void appendDateContext(StringBuilder prompt, String serviceDate) {
        if (serviceDate == null || serviceDate.isBlank()) return;

        LocalDate date;
        try {
            date = LocalDate.parse(serviceDate.trim());
        } catch (DateTimeParseException e) {
            return;
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        prompt.append("Dates - use these exactly, never calculate your own:\n")
                .append("  bugün / today = ").append(date.format(formatter)).append('\n')
                .append("  dün / yesterday = ").append(date.minusDays(1).format(formatter)).append('\n')
                .append("  önceki gün = ").append(date.minusDays(2).format(formatter)).append('\n')
                .append("Write a date only when the notes name a day or give one outright.\n");
    }

    /**
     * Lists the catalogue so the model reuses existing components and knows which
     * fields it may fill, instead of inventing a component per brand and model.
     */
    private void appendCatalogue(StringBuilder prompt) {
        List<Component> catalogue = componentService.getAllWithFields();
        if (catalogue.isEmpty()) return;

        prompt.append("\nComponent catalogue - copy these names exactly, and fill only the listed fields:\n");
        catalogue.stream().limit(MAX_CATALOGUE_ENTRIES).forEach(component -> {
            prompt.append("- ").append(component.getName());
            List<String> labels = component.getFields().stream().map(ComponentField::getLabel).toList();
            if (!labels.isEmpty()) {
                prompt.append(" (fields: ").append(String.join(", ", labels)).append(")");
            }
            prompt.append('\n');
        });
    }

    private Optional<CustomerSiteResponse> resolveCustomer(JsonNode hint) {
        String name = hint.path("name").asText("").trim();
        String site = hint.path("site").asText("").trim();
        if (name.isEmpty() && site.isEmpty()) return Optional.empty();

        // Resolution happens here rather than in the prompt, so the directory never
        // has to be shipped to the model and token cost stays flat as it grows.
        Optional<CustomerSite> match = customerService.resolve((name + " " + site).trim());
        if (match.isEmpty() && !name.isEmpty()) {
            match = customerService.resolve(name);
        }
        return match.map(CustomerSiteResponse::from);
    }

    private List<TemplateDraftResponse.DraftProduct> resolveProducts(JsonNode products) {
        List<TemplateDraftResponse.DraftProduct> resolved = new ArrayList<>();
        if (!products.isArray()) return resolved;

        for (JsonNode product : products) {
            String name = product.path("component").asText("").trim();
            if (name.isEmpty()) {
                name = product.path("name").asText("").trim(); // tolerate the older shape
            }
            if (name.isEmpty()) continue;

            int quantity = Math.max(1, product.path("quantity").asInt(1));
            Optional<Component> match = componentService.findByName(name);

            if (match.isEmpty()) {
                // Unknown material: keep what the technician said, but never create a
                // catalogue entry from a draft.
                resolved.add(new TemplateDraftResponse.DraftProduct(null, name, quantity, List.of()));
                continue;
            }

            Component component = match.get();
            resolved.add(new TemplateDraftResponse.DraftProduct(
                    component.getId(),
                    component.getName(),
                    quantity,
                    fieldValues(component, product.path("fields"))));
        }
        return resolved;
    }

    /** Fills the component's own fields with whatever the model put under matching labels. */
    private static List<TemplateDraftResponse.DraftFieldValue> fieldValues(Component component, JsonNode fields) {
        return component.getFields().stream()
                .map(field -> new TemplateDraftResponse.DraftFieldValue(
                        field.getLabel(),
                        field.getFieldType(),
                        valueFor(fields, field.getLabel())))
                .toList();
    }

    private static String valueFor(JsonNode fields, String label) {
        if (fields == null || !fields.isObject()) return "";
        String target = normalize(label);
        var names = fields.fieldNames();
        while (names.hasNext()) {
            String key = names.next();
            if (normalize(key).equals(target)) {
                return fields.path(key).asText("").trim();
            }
        }
        return "";
    }

    /** Turkish-aware comparison so "marka" matches "Marka" and "MARKA". */
    private static String normalize(String value) {
        if (value == null) return "";
        String lowered = value.toLowerCase(TR).replace('\u0131', 'i');
        return Normalizer.normalize(lowered, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .trim();
    }
}
