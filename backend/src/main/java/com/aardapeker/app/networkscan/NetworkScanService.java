package com.aardapeker.app.networkscan;

import com.aardapeker.app.dto.response.PageResponse;
import java.util.List;

public interface NetworkScanService {

    List<ScanHost> recordBatch(ScanBatchRequest request);

    PageResponse<ScanHostResponse> getPage(GetNetworkScansRequest request);

    List<String> getDistinctSources();

    List<ScanAgentSettingsResponse> listAgentSettings();

    ScanAgentSettingsResponse saveAgentSettings(String sourceId, ScanAgentSettingsRequest request);

    int cleanupExpiredForSource(String sourceId);
}
