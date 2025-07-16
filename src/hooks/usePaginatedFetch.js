// src/hooks/usePaginatedFetch.js

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import { toast } from 'sonner';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

// 1. เพิ่ม initialFilters เป็น parameter
export function usePaginatedFetch(apiUrl, initialItemsPerPage = 10, initialFilters = {}) {
    const token = useAuthStore((state) => state.token);
    
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: initialItemsPerPage,
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState(initialFilters); // 2. เพิ่ม state สำหรับเก็บ filter

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                search: debouncedSearchTerm,
                ...filters, // 3. ส่งค่า filters ทั้งหมดไปกับ params
            };
            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setData(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(`Failed to fetch data from ${apiUrl}`);
        } finally {
            setIsLoading(false);
        }
    }, [token, apiUrl, pagination.currentPage, pagination.itemsPerPage, debouncedSearchTerm, JSON.stringify(filters)]); // 4. เพิ่ม dependency

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };
    
    // 5. สร้างฟังก์ชันสำหรับจัดการ Filter
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    const handleItemsPerPageChange = (newSize) => {
        setPagination(prev => ({ ...prev, itemsPerPage: parseInt(newSize), currentPage: 1 }));
    };
    
    const refreshData = () => {
        fetchData();
    };

    // 6. ส่ง filters และ handleFilterChange กลับไปด้วย
    return { 
        data, 
        pagination, 
        isLoading, 
        searchTerm,
        filters,
        handleSearchChange, 
        handlePageChange, 
        handleItemsPerPageChange,
        handleFilterChange,
        refreshData
    };
}