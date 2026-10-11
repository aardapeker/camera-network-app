package com.aardapeker.app.pdf;

import java.util.List;

public record PdfConfirmRequest(
        List<Integer> selectedIndices,
        List<String> names,
        String clientUsername
) {}
