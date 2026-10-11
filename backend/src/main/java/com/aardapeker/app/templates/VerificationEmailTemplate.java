package com.aardapeker.app.templates;

public final class VerificationEmailTemplate {

    private VerificationEmailTemplate() {
    }

    public static String content(String code) {
        return """
                <p style="font-size:15px; color:#555; text-align:center;">
                    Use the verification code below to finish creating your account.
                </p>

                <div style="text-align:center; padding:24px 0;">
                    <div style="
                        display:inline-block;
                        padding:14px 24px;
                        font-size:24px;
                        letter-spacing:4px;
                        font-weight:bold;
                        color:#1a73e8;
                        background:#f1f5ff;
                        border-radius:6px;
                    ">
                        %s
                    </div>
                </div>

                <p style="font-size:13px; color:#888; text-align:center;">
                    This code will expire in 1 hour.<br/>
                    If you did not request this, you can safely ignore this email.
                </p>
                """.formatted(code);
    }
}
