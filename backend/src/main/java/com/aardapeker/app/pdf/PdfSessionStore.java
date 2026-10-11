package com.aardapeker.app.pdf;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PdfSessionStore {

    private final ConcurrentHashMap<String, PdfSession> sessions = new ConcurrentHashMap<>();

    public void put(PdfSession session) {
        sessions.put(session.getSessionId(), session);
    }

    public PdfSession get(String sessionId) {
        return sessions.get(sessionId);
    }

    public void remove(String sessionId) {
        sessions.remove(sessionId);
    }

    public Collection<PdfSession> all() {
        return sessions.values();
    }
}
