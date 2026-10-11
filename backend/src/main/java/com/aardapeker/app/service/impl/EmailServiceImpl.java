package com.aardapeker.app.service.impl;

import com.aardapeker.app.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender emailSender;
    private final String from;
    private final String fromName;

    public EmailServiceImpl(
        JavaMailSender emailSender,
        @Value("${mail.from:}") String from,
        @Value("${mail.from-name:}") String fromName,
        @Value("${spring.mail.username:}") String username
    ) {
        this.emailSender = emailSender;
        // MAIL_FROM is the address recipients see. Fall back to the SMTP login so
        // mail still carries a valid sender when it hasn't been configured.
        this.from = from.isBlank() ? username : from;
        this.fromName = fromName;
    }

    @Override
    public void sendVerificationEmail(String to, String subject, String text)
        throws MessagingException {
        MimeMessage message = emailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        applyFrom(helper);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text, true);

        emailSender.send(message);
    }

    private void applyFrom(MimeMessageHelper helper) throws MessagingException {
        if (from.isBlank()) {
            return;
        }

        try {
            if (fromName.isBlank()) {
                helper.setFrom(from);
            } else {
                helper.setFrom(from, fromName);
            }
        } catch (UnsupportedEncodingException e) {
            throw new MessagingException("Could not encode MAIL_FROM_NAME", e);
        }
    }
}
