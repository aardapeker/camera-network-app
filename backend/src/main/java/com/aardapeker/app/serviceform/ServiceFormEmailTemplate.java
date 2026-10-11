package com.aardapeker.app.serviceform;

import java.time.format.DateTimeFormatter;

public final class ServiceFormEmailTemplate {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private ServiceFormEmailTemplate() {}

    public static String render(ServiceForm form, String technicianName) {
        return """
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Servis Formu</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
                  <tr><td align="center">
                    <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:600px;">

                      <!-- Header -->
                      <tr>
                        <td style="background:#1a1a2e;border-radius:12px 12px 0 0;padding:28px 32px;">
                          <p style="margin:0 0 4px 0;font-size:12px;color:#8888aa;letter-spacing:1px;text-transform:uppercase;">FieldDesk</p>
                          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">🔧 Servis Formu</h1>
                          <p style="margin:8px 0 0 0;font-size:15px;color:#a0a8c0;">%s</p>
                        </td>
                      </tr>

                      <!-- Status badges -->
                      <tr>
                        <td style="background:#16213e;padding:14px 32px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              %s
                              %s
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="background:#ffffff;padding:28px 32px;">

                          %s
                          %s
                          %s
                          %s
                          %s

                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f8f9fa;border-radius:0 0 12px 12px;border-top:1px solid #e8eaed;padding:20px 32px;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td>
                                <p style="margin:0;font-size:13px;color:#666;">Teknisyen: <strong style="color:#333;">%s</strong></p>
                                %s
                              </td>
                              <td align="right">
                                <p style="margin:0;font-size:12px;color:#999;">© 2026 FieldDesk</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td></tr>
                </table>
                </body>
                </html>
                """.formatted(
                form.getCustomerName(),
                badge(labelOf(form.getServiceLocation()), "#0ea5e9"),
                badge(labelOf(form.getServiceStatus()), "#8b5cf6"),
                customerSection(form),
                scheduleSection(form),
                serviceSection(form),
                productsSection(form),
                notesSection(form),
                technicianName,
                form.getStaffCount() != null
                    ? "<p style=\"margin:4px 0 0 0;font-size:13px;color:#666;\">Personel: <strong style=\"color:#333;\">" + form.getStaffCount() + " kişi</strong></p>"
                    : ""
        );
    }

    private static String badge(String label, String color) {
        if (label == null) return "<td></td>";
        return """
                <td style="padding-right:8px;">
                  <span style="display:inline-block;padding:4px 12px;background:%s22;color:%s;border:1px solid %s44;border-radius:20px;font-size:12px;font-weight:600;">%s</span>
                </td>
                """.formatted(color, color, color, label);
    }

    private static String sectionTitle(String title) {
        return """
                <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;color:#888;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #f0f0f0;padding-bottom:6px;">%s</p>
                """.formatted(title);
    }

    private static String infoRow(String label, String value) {
        if (value == null || value.isBlank()) return "";
        return """
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#888;width:45%%;vertical-align:top;">%s</td>
                  <td style="padding:7px 0;font-size:13px;color:#222;font-weight:500;vertical-align:top;">%s</td>
                </tr>
                """.formatted(label, value);
    }

    private static String customerSection(ServiceForm form) {
        String rows = infoRow("Müşteri", form.getCustomerName())
                + infoRow("İlgili Kişi", form.getContactPerson())
                + infoRow("Telefon", form.getPhone())
                + infoRow("E-posta", form.getEmail())
                + infoRow("Adres", form.getAddress());
        if (rows.isBlank()) return "";
        return """
                <div style="margin-bottom:24px;">
                  %s
                  <table width="100%%" cellpadding="0" cellspacing="0">%s</table>
                </div>
                """.formatted(sectionTitle("Müşteri Bilgileri"), rows);
    }

    private static String scheduleSection(ServiceForm form) {
        String date = form.getServiceDate() != null ? form.getServiceDate().format(DATE_FMT) : null;
        String arrival = form.getArrivalTime() != null ? form.getArrivalTime().format(TIME_FMT) : null;
        String delivery = form.getDeliveryTime() != null ? form.getDeliveryTime().format(TIME_FMT) : null;

        String rows = infoRow("Tarih", date)
                + infoRow("Geliş Saati", arrival)
                + infoRow("Teslim Saati", delivery);
        if (rows.isBlank()) return "";
        return """
                <div style="margin-bottom:24px;">
                  %s
                  <table width="100%%" cellpadding="0" cellspacing="0">%s</table>
                </div>
                """.formatted(sectionTitle("Tarih & Saat"), rows);
    }

    private static String serviceSection(ServiceForm form) {
        StringBuilder html = new StringBuilder();

        if (form.getFaultDescription() != null && !form.getFaultDescription().isBlank()) {
            html.append(textBlock("Arıza Açıklaması", form.getFaultDescription(), "#fffbeb", "#b45309"));
        }
        if (form.getServiceDescription() != null && !form.getServiceDescription().isBlank()) {
            html.append(textBlock("Servis Açıklaması", form.getServiceDescription(), "#eff6ff", "#1d4ed8"));
        }
        if (form.getNotification() != null && !form.getNotification().isBlank()) {
            html.append(textBlock("Bildirim", form.getNotification(), "#f9fafb", "#374151"));
        }

        if (html.isEmpty()) return "";
        return "<div style=\"margin-bottom:24px;\">" + sectionTitle("Servis Detayları") + html + "</div>";
    }

    private static String textBlock(String label, String value, String bg, String borderColor) {
        return """
                <div style="margin-bottom:12px;">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;">%s</p>
                  <div style="background:%s;border-left:3px solid %s;border-radius:0 4px 4px 0;padding:10px 14px;">
                    <p style="margin:0;font-size:13px;color:#1f2937;line-height:1.6;">%s</p>
                  </div>
                </div>
                """.formatted(label, bg, borderColor, value.replace("\n", "<br>"));
    }

    private static String productsSection(ServiceForm form) {
        if (form.getProducts() == null || form.getProducts().isEmpty()) return "";

        StringBuilder rows = new StringBuilder();
        boolean alt = false;
        for (ServiceFormProduct p : form.getProducts()) {
            String bg = alt ? "#f9fafb" : "#ffffff";
            String extraFields = p.getFieldValues() == null || p.getFieldValues().isEmpty() ? "" :
                    p.getFieldValues().stream()
                            .filter(fv -> fv.getValue() != null && !fv.getValue().isBlank())
                            .map(fv -> "%s: %s".formatted(fv.getLabel(), fv.getValue()))
                            .reduce((a, b) -> a + " · " + b)
                            .map(text -> "<div style=\"margin-top:2px;font-size:11px;color:#9ca3af;\">%s</div>".formatted(text))
                            .orElse("");
            rows.append("""
                    <tr style="background:%s;">
                      <td style="padding:10px 12px;font-size:13px;color:#1f2937;border-bottom:1px solid #f0f0f0;">%s%s</td>
                      <td style="padding:10px 12px;font-size:13px;color:#1f2937;font-weight:600;text-align:center;border-bottom:1px solid #f0f0f0;">%d</td>
                    </tr>
                    """.formatted(bg, p.getProductName(), extraFields, p.getQuantity()));
            alt = !alt;
        }

        return """
                <div style="margin-bottom:24px;">
                  %s
                  <table width="100%%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                    <thead>
                      <tr style="background:#f3f4f6;">
                        <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px;">Ürün Adı</th>
                        <th style="padding:10px 12px;font-size:12px;font-weight:700;color:#6b7280;text-align:center;text-transform:uppercase;letter-spacing:0.5px;">Adet</th>
                      </tr>
                    </thead>
                    <tbody>%s</tbody>
                  </table>
                </div>
                """.formatted(sectionTitle("Ürünler"), rows);
    }

    private static String notesSection(ServiceForm form) {
        if (form.getDeliveryNotes() == null || form.getDeliveryNotes().isBlank()) return "";
        return "<div style=\"margin-bottom:8px;\">" + textBlock("Teslimat Notları", form.getDeliveryNotes(), "#f9fafb", "#374151") + "</div>";
    }

    private static String labelOf(ServiceLocation loc) {
        if (loc == null) return null;
        return switch (loc) {
            case ON_SITE -> "Yerinde";
            case IN_SERVICE -> "Serviste";
            case REMOTE -> "Uzaktan";
        };
    }

    private static String labelOf(ServiceFormStatus status) {
        if (status == null) return null;
        return switch (status) {
            case CONTRACTED -> "Sözleşmeli";
            case PAID -> "Ücretli";
            case FREE -> "Ücretsiz";
            case TECHNICAL_SUPPORT -> "Teknik Destek";
            case NEW_INSTALLATION -> "Yeni Kurulum";
        };
    }
}
