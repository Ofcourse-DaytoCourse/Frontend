"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/ui/rating";
import { 
  MapPin, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Star,
  ChevronRight,
  Heart,
  Loader2
} from "lucide-react";
import { getPlaces, getPlaceCategories, searchPlaces, getPlaceReviews } from "@/lib/places-api";
import type { Place, PlaceCategory, PlaceFilters } from "@/types/places";
import { SEOUL_DISTRICTS } from "@/types/places";

export default function PlacesPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [filters, setFilters] = useState<PlaceFilters>(() => {
    // localStorage에서 필터 상태 복원
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem('places-filters');
        if (savedFilters) {
          return JSON.parse(savedFilters);
        }
      } catch (error) {
        console.error('필터 상태 로드 실패:', error);
      }
    }
    return {
      category: 'all',
      region: 'all', 
      search: '',
      sortBy: 'name',
      minRating: 0,
      hasParking: false,
      hasPhone: false
    };
  });
  
  // 검색 자동완성 관련 상태
  const [searchInput, setSearchInput] = useState(() => {
    // localStorage에서 검색어도 복원
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem('places-filters');
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          return parsed.search || '';
        }
      } catch (error) {
        console.error('검색어 상태 로드 실패:', error);
      }
    }
    return '';
  });
  const [searchSuggestions, setSearchSuggestions] = useState<Place[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [totalCount, setTotalCount] = useState(0);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  // 필터 변경 시 localStorage에 저장 및 1페이지로 리셋 후 데이터 로드
  useEffect(() => {
    // localStorage에 필터 상태 저장
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('places-filters', JSON.stringify(filters));
      } catch (error) {
        console.error('필터 상태 저장 실패:', error);
      }
    }
    
    if (categories.length > 0) { // 카테고리가 로드된 후에만 실행
      setPagination(prev => ({ ...prev, page: 1 })); // 필터 변경시 1페이지로
      loadPlaces(true); // 필터 변경 시 데이터 다시 로드
    }
  }, [filters]);
  
  // 페이지네이션 변경 시 데이터 로드
  useEffect(() => {
    if (categories.length > 0) { // 카테고리가 로드된 후에만 실행
      loadPlaces(true);
    }
  }, [pagination.page]);

  // 디바운싱된 검색어 추천
  useEffect(() => {
    if (searchInput.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const suggestions = await searchPlaces(searchInput, 0, 8); // 최대 8개 추천
          setSearchSuggestions(suggestions.places);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        } catch (error) {
          console.error('검색어 추천 실패:', error);
          setSearchSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms 후 검색

      return () => clearTimeout(timer);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  }, [searchInput]);

  // 검색창 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([
        getPlaceCategories()
      ]);
      setCategories(categoriesData);
      setPagination(prev => ({ ...prev, page: 1 })); // 초기 로드시 1페이지로
      
      // 초기 장소 데이터 로드
      await loadPlaces();
    } catch (error) {
      console.error("초기 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaces = async (reset: boolean = false) => {
    try {
      setLoading(true);

      // 필터와 페이지네이션 파라미터 전달
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        limit: pagination.limit,
        ...(filters.category !== 'all' && { category_id: parseInt(filters.category) }),
        ...(filters.search && { search: filters.search }),
        ...(filters.region !== 'all' && { region: filters.region }),
        ...(filters.sortBy && { sort_by: filters.sortBy }),
        ...(filters.minRating > 0 && { min_rating: filters.minRating }),
        ...(filters.hasParking && { has_parking: filters.hasParking }),
        ...(filters.hasPhone && { has_phone: filters.hasPhone })
      };

      let data = await getPlaces(params);
      
      console.log('API 응답 데이터:', data);
      console.log('장소 수:', data.places ? data.places.length : 0);
      
      // 원래대로 장소 데이터만 바로 사용
      setPlaces(data.places);
      setTotalCount(data.total_count);
      setHasMore(data.total_count > pagination.page * pagination.limit);
    } catch (error) {
      console.error("장소 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setFilters(prev => ({ ...prev, search: searchInput.trim() }));
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (place: Place) => {
    // 선택된 장소로 즉시 이동
    router.push(`/places/${place.place_id}`);
  };

  const handleSuggestionSelect = (place: Place) => {
    setSearchInput(place.name);
    setFilters(prev => ({ ...prev, search: place.name }));
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setFilters(prev => ({ ...prev, category: categoryId }));
    setPagination(prev => ({ ...prev, page: 1 })); // 필터 변경시 1페이지로
  };

  const handlePageChange = (newPage: number) => {
    if (!loading && newPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePlaceClick = (placeId: string) => {
    router.push(`/places/${placeId}`);
  };

  // 로딩 스켈레톤
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">인기 장소 둘러보기</h1>
            <p className="text-gray-600">다른 사용자들이 추천하는 핫플을 확인해보세요 ✨</p>
          </div>
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">인기 장소 둘러보기</h1>
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{places.length.toLocaleString()}</span>개의 장소가 찾아졌어요 ✨
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4">
            {/* 검색바 with 자동완성 */}
            <div className="relative" ref={searchContainerRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="장소명이나 주소로 검색... (2글자 이상)"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="pl-10 pr-10 bg-white"
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* 자동완성 드롭다운 */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto mt-1">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                      검색 중...
                    </div>
                  ) : searchSuggestions.length > 0 ? (
                    <>
                      {searchSuggestions.map((place, index) => (
                        <div
                          key={place.place_id}
                          className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                            index === selectedSuggestionIndex ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleSuggestionClick(place)}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{place.name}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {place.address || '주소 정보 없음'}
                              </div>
                              {place.category_name && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {place.category_name}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                      <div className="p-2 text-center text-xs text-gray-400 border-t bg-gray-50">
                        위/아래 키로 선택, 엔터로 이동
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 필터 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 카테고리 필터 */}
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">모든 카테고리</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* 지역 필터 */}
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">모든 지역</option>
                {SEOUL_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>

              {/* 정렬 옵션 */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">이름순</option>
                <option value="rating_desc">평점 높은 순</option>
                <option value="review_count_desc">후기 많은 순</option>
                <option value="latest">최신 등록순</option>
              </select>

              {/* 평점 필터 */}
              <select
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>모든 평점</option>
                <option value={3}>3점 이상</option>
                <option value={4}>4점 이상</option>
                <option value={5}>5점만</option>
              </select>

              {/* 고급 필터 */}
              <div className="flex gap-2">
                <label className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.hasParking}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasParking: e.target.checked }))}
                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>주차 가능</span>
                </label>
                <label className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                    className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>전화번호</span>
                </label>
              </div>
            </div>

            {/* 적용된 필터 표시 */}
            {(filters.category !== 'all' || filters.region !== 'all' || filters.search || filters.minRating > 0 || filters.hasParking || filters.hasPhone) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 font-medium">적용된 필터:</span>
                {filters.category !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {categories.find(c => c.category_id.toString() === filters.category)?.name}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.region !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.region}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, region: 'all' }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    검색: {filters.search}
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, search: '' }));
                        setSearchInput('');
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.minRating > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.minRating}점 이상
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.hasParking && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    주차 가능
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, hasParking: false }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.hasPhone && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    전화번호 있음
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, hasPhone: false }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const resetFilters = {
                      category: 'all',
                      region: 'all',
                      search: '',
                      sortBy: 'name',
                      minRating: 0,
                      hasParking: false,
                      hasPhone: false
                    };
                    setFilters(resetFilters);
                    setSearchInput('');
                    // localStorage에서도 제거
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('places-filters');
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm h-6 px-2"
                >
                  모든 필터 초기화
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 장소 목록 */}
        {places.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500 mb-6">다른 검색어를 사용하거나 필터를 변경해보세요</p>
            <Button 
              onClick={() => {
                const resetFilters = { category: 'all', region: 'all', search: '', sortBy: 'name', minRating: 0, hasParking: false, hasPhone: false };
                setFilters(resetFilters);
                setSearchInput('');
                // localStorage에서도 제거
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('places-filters');
                }
              }}
              variant="outline"
            >
              필터 초기화
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {places.map((place) => (
                <Card 
                  key={place.place_id} 
                  className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                  onClick={() => handlePlaceClick(place.place_id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {place.name}
                      </CardTitle>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                    </div>
                    
                    {place.category_name && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        {place.category_name}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {place.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{place.address}</span>
                      </div>
                    )}
                    
                    {place.summary && (
                      <p className="text-sm text-gray-700 line-clamp-3 mb-4 leading-relaxed">
                        {place.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {place.review_count && place.review_count > 0 ? (
                          <>
                            <Rating 
                              value={place.average_rating || 0} 
                              readonly 
                              size="sm" 
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {place.average_rating?.toFixed(1)} ({place.review_count}개 후기)
                            </span>
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 text-gray-300" />
                            <span className="text-sm text-gray-500">후기 없음</span>
                          </>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceClick(place.place_id);
                        }}
                      >
                        자세히 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalCount > pagination.limit && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  이전
                </Button>
                
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pagination.limit)) }, (_, i) => {
                  const totalPages = Math.ceil(totalCount / pagination.limit);
                  let pageNum;
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10 h-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(totalCount / pagination.limit)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}