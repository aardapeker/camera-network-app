package com.aardapeker.app.dto.response;

import java.util.List;
import org.springframework.data.domain.Page;

public class PageResponse<T> {

    private long totalItems;
    private int totalPages;
    private int pageSize;
    private int currentPage;
    private boolean hasNext;
    private boolean hasPrevious;
    private List<T> content;

    public PageResponse() {}

    public PageResponse(Page<T> page) {
        this.totalItems = page.getTotalElements();
        this.totalPages = page.getTotalPages();
        this.pageSize = page.getSize();
        this.currentPage = page.getNumber();
        this.hasNext = page.hasNext();
        this.hasPrevious = page.hasPrevious();
        this.content = page.getContent();
    }

    public PageResponse(
        long totalItems,
        int totalPages,
        int pageSize,
        int currentPage,
        boolean hasNext,
        boolean hasPrevious,
        List<T> content
    ) {
        this.totalItems = totalItems;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
        this.hasNext = hasNext;
        this.hasPrevious = hasPrevious;
        this.content = content;
    }

    // Static factory method for convenience
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page);
    }

    // Getters and setters
    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }

    public boolean isHasPrevious() {
        return hasPrevious;
    }

    public void setHasPrevious(boolean hasPrevious) {
        this.hasPrevious = hasPrevious;
    }
}
