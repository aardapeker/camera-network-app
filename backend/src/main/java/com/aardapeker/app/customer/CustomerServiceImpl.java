package com.aardapeker.app.customer;

import com.aardapeker.app.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomerServiceImpl implements CustomerService {

    private static final int MAX_RESULTS = 10;
    private static final Locale TR = new Locale("tr", "TR");

    private final CustomerRepository repository;
    private final CustomerSiteRepository siteRepository;

    public CustomerServiceImpl(CustomerRepository repository, CustomerSiteRepository siteRepository) {
        this.repository = repository;
        this.siteRepository = siteRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerSite> search(String query) {
        List<CustomerSite> all = siteRepository.findAllWithCustomer();
        String[] tokens = tokenize(query);
        if (tokens.length == 0) {
            return all.stream().limit(MAX_RESULTS).toList();
        }
        return all.stream()
                .map(site -> new Scored(site, score(site, tokens)))
                .filter(scored -> scored.score > 0)
                .sorted(Comparator.comparingInt((Scored s) -> s.score).reversed())
                .limit(MAX_RESULTS)
                .map(scored -> scored.site)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CustomerSite> resolve(String phrase) {
        String[] tokens = tokenize(phrase);
        if (tokens.length == 0) return Optional.empty();

        // Only accept a match that accounts for every word the technician said,
        // so a half-understood phrase does not silently pick the wrong site.
        return siteRepository.findAllWithCustomer().stream()
                .map(site -> new Scored(site, score(site, tokens)))
                .filter(scored -> scored.score >= tokens.length)
                .max(Comparator.comparingInt(scored -> scored.score))
                .map(scored -> scored.site);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Customer> getAll() {
        return repository.findAllWithSites();
    }

    @Override
    @Transactional
    public Customer create(String name, String shortName) {
        return repository.save(Customer.builder()
                .name(name.trim())
                .shortName(blankToNull(shortName))
                .build());
    }

    @Override
    @Transactional
    public Customer update(UUID id, String name, String shortName) {
        Customer customer = getOrThrow(id);
        customer.setName(name.trim());
        customer.setShortName(blankToNull(shortName));
        return repository.save(customer);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        repository.delete(getOrThrow(id));
    }

    @Override
    @Transactional
    public CustomerSite addSite(UUID customerId, CustomerRequests.SaveCustomerSiteRequest request) {
        Customer customer = getOrThrow(customerId);
        CustomerSite site = CustomerSite.builder()
                .customer(customer)
                .label(request.label().trim())
                .address(blankToNull(request.address()))
                .contactPerson(blankToNull(request.contactPerson()))
                .phone(blankToNull(request.phone()))
                .email(blankToNull(request.email()))
                .orderIndex(customer.getSites().size())
                .build();
        return siteRepository.save(site);
    }

    @Override
    @Transactional
    public CustomerSite updateSite(UUID customerId, UUID siteId, CustomerRequests.SaveCustomerSiteRequest request) {
        CustomerSite site = getSiteOrThrow(customerId, siteId);
        site.setLabel(request.label().trim());
        site.setAddress(blankToNull(request.address()));
        site.setContactPerson(blankToNull(request.contactPerson()));
        site.setPhone(blankToNull(request.phone()));
        site.setEmail(blankToNull(request.email()));
        return siteRepository.save(site);
    }

    @Override
    @Transactional
    public void deleteSite(UUID customerId, UUID siteId) {
        siteRepository.delete(getSiteOrThrow(customerId, siteId));
    }

    @Override
    @Transactional
    public CustomerSite quickAdd(CustomerRequests.QuickAddCustomerRequest request) {
        String customerName = request.customerName().trim();
        Customer customer = repository.findFirstByNameIgnoreCase(customerName)
                .orElseGet(() -> repository.save(Customer.builder().name(customerName).build()));

        String label = request.siteLabel() == null || request.siteLabel().isBlank()
                ? "Merkez"
                : request.siteLabel().trim();

        return addSite(customer.getId(), new CustomerRequests.SaveCustomerSiteRequest(
                label, request.address(), request.contactPerson(), request.phone(), null));
    }

    // --- matching ---

    private record Scored(CustomerSite site, int score) {}

    /**
     * Counts how many of the query's words appear in the entry. Customer name and
     * site label are weighted above the address so "Barsan Samandira" prefers the
     * Samandira site over one that merely mentions the word in its address.
     */
    private static int score(CustomerSite site, String[] tokens) {
        String customer = normalize(site.getCustomer().getName());
        String shortName = normalize(site.getCustomer().getShortName());
        String label = normalize(site.getLabel());
        String address = normalize(site.getAddress());

        int score = 0;
        for (String token : tokens) {
            if (customer.contains(token) || shortName.contains(token) || label.contains(token)) {
                score += 2;
            } else if (address.contains(token)) {
                score += 1;
            } else {
                return 0; // every word must land somewhere
            }
        }
        return score;
    }

    private static String[] tokenize(String query) {
        String normalized = normalize(query);
        if (normalized.isEmpty()) return new String[0];
        return normalized.split("\\s+");
    }

    /** Lowercases with Turkish rules and strips diacritics, so "Samandıra" matches "samandira". */
    private static String normalize(String value) {
        if (value == null) return "";
        String lowered = value.toLowerCase(TR).replace('ı', 'i');
        String stripped = Normalizer.normalize(lowered, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return stripped.trim();
    }

    private Customer getOrThrow(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
    }

    private CustomerSite getSiteOrThrow(UUID customerId, UUID siteId) {
        CustomerSite site = siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer site not found: " + siteId));
        if (!site.getCustomer().getId().equals(customerId)) {
            throw new ResourceNotFoundException("Customer site not found: " + siteId);
        }
        return site;
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
