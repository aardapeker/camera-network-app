package com.aardapeker.app.component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/**
 * Gives hardware components the Marka and Model fields the paper form's
 * "Marka/Model/Aciklama" column implies, so a dictated "dahua 1432" fills those
 * fields on the Kamera component instead of becoming a component of its own.
 *
 * Runs once: if any component already carries a Marka field, the fields are
 * assumed to be managed by hand from the admin page and nothing is touched.
 * Consumables sold by length or count (cable, connectors, trunking) are skipped.
 */
@Service
public class ComponentBrandModelSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ComponentBrandModelSeeder.class);
    private static final Locale TR = new Locale("tr", "TR");

    private static final String BRAND_FIELD = "Marka";
    private static final String MODEL_FIELD = "Model";

    /** Component names that identify a device with a brand and model. */
    private static final List<String> HARDWARE_KEYWORDS = List.of(
            "kamera", "nvr", "dvr", "kayit cihazi", "switch", "ups", "adaptor", "monitor",
            "panel", "keypad", "siren", "dedektor", "cevirici", "konverter", "media konverter",
            "hdd", "hard disk", "sd kart", "kabin", "server", "access point", "kartli gecis",
            "interkom", "pdu", "router", "modem", "anten", "sinyal guclendirici");

    /** Sold by length or piece with no brand/model on the form. */
    private static final List<String> CONSUMABLE_KEYWORDS = List.of(
            "kablo", "konnektor", "keystone", "buat", "kanal", "spiral", "boru", "priz",
            "fis", "patch panel", "montaj", "aparat", "kutu", "baca", "dubel", "klips");

    private final ComponentRepository repository;
    private final ComponentFieldRepository fieldRepository;

    public ComponentBrandModelSeeder(ComponentRepository repository, ComponentFieldRepository fieldRepository) {
        this.repository = repository;
        this.fieldRepository = fieldRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Component> components = repository.findAllWithFields();
        if (components.isEmpty()) return;

        boolean alreadyManaged = components.stream()
                .flatMap(c -> c.getFields().stream())
                .anyMatch(f -> normalize(f.getLabel()).equals(normalize(BRAND_FIELD)));
        if (alreadyManaged) return;

        int updated = 0;
        for (Component component : components) {
            if (!isHardware(component.getName())) continue;

            int nextOrder = component.getFields().size();
            if (!hasField(component, BRAND_FIELD)) {
                fieldRepository.save(newField(component, BRAND_FIELD, nextOrder++));
            }
            if (!hasField(component, MODEL_FIELD)) {
                fieldRepository.save(newField(component, MODEL_FIELD, nextOrder));
            }
            updated++;
        }

        if (updated > 0) {
            logger.info("✅ Added Marka/Model fields to {} hardware components", updated);
        }
    }

    private static ComponentField newField(Component component, String label, int orderIndex) {
        return ComponentField.builder()
                .component(component)
                .label(label)
                .fieldType(ComponentFieldType.TEXT)
                .orderIndex(orderIndex)
                .build();
    }

    private static boolean hasField(Component component, String label) {
        String target = normalize(label);
        return component.getFields().stream().anyMatch(f -> normalize(f.getLabel()).equals(target));
    }

    private static boolean isHardware(String name) {
        String normalized = normalize(name);
        if (CONSUMABLE_KEYWORDS.stream().anyMatch(normalized::contains)) return false;
        return HARDWARE_KEYWORDS.stream().anyMatch(normalized::contains);
    }

    private static String normalize(String value) {
        if (value == null) return "";
        String lowered = value.toLowerCase(TR).replace('ı', 'i');
        return Normalizer.normalize(lowered, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .trim();
    }
}
