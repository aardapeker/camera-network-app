package com.aardapeker.app.templates;

public final class EmailLayout {

  private EmailLayout() {
  }

  public static String render(String title, String bodyHtml) {
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">
            <title>%s</title>
        </head>

        <body style="
            margin:0;
            padding:0;
            background-color:#f4f6f8;
            font-family:Arial, Helvetica, sans-serif;
        ">

        <table width="100%%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding:40px 10px;">

                    <table width="100%%" style="
                        max-width:480px;
                        background:#ffffff;
                        border-radius:8px;
                        padding:32px;
                        box-shadow:0 4px 12px rgba(0,0,0,0.08);
                    ">

                        <!-- Header -->
                        <tr>
                            <td style="text-align:center; padding-bottom:24px;">
                                <h2 style="margin:0; color:#222;">%s</h2>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td>
                                %s
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="padding-top:32px; text-align:center;">
                                <p style="font-size:12px; color:#888; margin:0;">
                                    &#169; 2025 Your App Name
                                </p>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

        </body>
        </html>
        """.formatted(title, title, bodyHtml);
  }
}
