package com.aardapeker.app.templates;

public final class ResetPasswordEmailTemplate {

    private ResetPasswordEmailTemplate() {}

    public static String content(String resetLink) {
        return """
        <p style="font-size:15px; color:#555; text-align:center;">
            We received a request to reset your password.
        </p>

        <div style="
            margin:24px auto;
            max-width:420px;
            padding:14px;
            background:#f1f5ff;
            border-radius:6px;
            font-family:monospace;
            font-size:14px;
            color:#1a73e8;
            word-break:break-all;
            text-align:left;
        ">
            <strong>Reset link:</strong><br/>
            %s
        </div>

        <p style="font-size:13px; color:#888; text-align:center;">
            Copy and paste this link into your browser to reset your password.<br/>
            This link will expire soon.<br/>
            If you did not request a password reset, you can safely ignore this email.
        </p>
        """.formatted(resetLink);
    }
}
