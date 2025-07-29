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
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getPlaces, searchPlaces, getPlaceReviews, aiSearchPlaces, getMajorCategories, getMiddleCategories, getMinorCategories } from "@/lib/places-api";
import { paymentsApi } from "@/lib/payments-api";
import type { Place, PlaceFilters } from "@/types/places";
import { SEOUL_DISTRICTS } from "@/types/places";
import type { AISearchRequest, AISearchResponse } from "@/lib/places-api";
import { toast } from "sonner";
import { useBalanceData } from "@/hooks/use-balance-data";
import { TokenStorage, UserStorage } from "@/lib/storage";

export default function PlacesPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // 현재 사용자 정보 가져오기
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const user = UserStorage.get();
    setCurrentUser(user);
  }, []);

  // 사용자별 localStorage 키 생성 함수
  const getUserStorageKey = (key: string) => {
    return currentUser ? `${key}_${currentUser.user_id}` : key;
  };
  
  const [places, setPlaces] = useState<Place[]>([]);
  
  // 카테고리 상태들 (동적 로드)
  const [majorCategories, setMajorCategories] = useState<string[]>([]);
  const [middleCategories, setMiddleCategories] = useState<string[]>([]);
  const [minorCategories, setMinorCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<PlaceFilters>(() => {
    // localStorage에서 필터 상태 복원
    if (typeof window !== 'undefined') {
      try {
        const savedFilters = localStorage.getItem('places-filters');
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          // 기존 설정이 있어도 sortBy는 강제로 review_count_desc로 설정
          return {
            ...parsed,
            sortBy: 'review_count_desc'
          };
        }
      } catch (error) {
        console.error('필터 상태 로드 실패:', error);
      }
    }
    return {
      category: 'all',
      region: 'all', 
      search: '',
      sortBy: 'review_count_desc',
      minRating: 0,
      hasParking: false,
      hasPhone: false,
      middleCategory: 'all',
      minorCategory: 'all',
      middleCategory: 'all',
      minorCategory: 'all'
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
  const [pagination, setPagination] = useState({ page: 1, limit: 21 });
  const [totalCount, setTotalCount] = useState(0);

  // AI 검색 관련 상태 (사용자별로 분리)
  const [aiSearchResults, setAiSearchResults] = useState<Place[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [showAiResults, setShowAiResults] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiSearchForm, setAiSearchForm] = useState({ 
    description: '', 
    district: '전체', 
    major_category: '전체',
    middle_category: '전체', 
    minor_category: '전체'
  });
  // 기존 useState 대신 useBalanceData 훅 사용 (실시간 업데이트 활성화)
  const { balance, refreshBalance } = useBalanceData(true, 30);
  
  // AI 검색 섹션 토글 상태 (기본적으로 닫혀있음)
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  // 검색 결과 표시 제어
  const displayPlaces = showAiResults ? aiSearchResults : places;
  const searchResultTitle = showAiResults 
    ? `AI 검색 결과 (${aiSearchResults.length}개)` 
    : `일반 검색 결과 (${places.length}개)`;

  // 사용자별 AI 검색 데이터 로드
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      try {
        const savedResults = localStorage.getItem(getUserStorageKey('ai-search-results'));
        const savedShowResults = localStorage.getItem(getUserStorageKey('show-ai-results'));
        const savedForm = localStorage.getItem(getUserStorageKey('ai-search-form'));
        
        if (savedResults) {
          setAiSearchResults(JSON.parse(savedResults));
        }
        if (savedShowResults) {
          setShowAiResults(savedShowResults === 'true');
        }
        if (savedForm) {
          setAiSearchForm(JSON.parse(savedForm));
        }
      } catch (error) {
        console.error('AI 검색 데이터 로드 실패:', error);
      }
    }
  }, [currentUser]);

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
    
    setPagination(prev => ({ ...prev, page: 1 })); // 필터 변경시 1페이지로
    loadPlaces(true); // 필터 변경 시 데이터 다시 로드
  }, [filters]);
  
  // 페이지네이션 변경 시 데이터 로드
  useEffect(() => {
    loadPlaces(true);
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

  // 컴포넌트 언마운트시 메모리 정리
  useEffect(() => {
    return () => {
      // 상태 초기화
      setSearchSuggestions([]);
      setAiSearchResults([]);
      setPlaces([]);
      // 타이머나 인터벌 정리는 useBalanceData 훅에서 자동 처리됨
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setPagination(prev => ({ ...prev, page: 1 })); // 초기 로드시 1페이지로
      
      // 카테고리 데이터 로드
      const [majorCatsData] = await Promise.all([
        getMajorCategories()
      ]);
      setMajorCategories(majorCatsData.categories);
      
      // useBalanceData 훅에서 자동으로 day를 로드하므로 별도 처리 불필요
      
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
        ...(filters.category !== 'all' && { major_category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.region !== 'all' && { region: filters.region }),
        ...(filters.sortBy && { sort_by: filters.sortBy }),
        ...(filters.minRating > 0 && { min_rating: filters.minRating }),
        ...(filters.hasParking && { has_parking: filters.hasParking }),
        ...(filters.hasPhone && { has_phone: filters.hasPhone }),
        ...(filters.middleCategory !== 'all' && { middle_category: filters.middleCategory }),
        ...(filters.minorCategory !== 'all' && { minor_category: filters.minorCategory })
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

  const handleCategoryChange = async (categoryId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      category: categoryId,
      middleCategory: 'all',  // 대분류 변경시 중/소분류 초기화
      minorCategory: 'all'
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // 필터 변경시 1페이지로
    
    // 중분류 카테고리 로드
    if (categoryId !== 'all') {
      try {
        const middleCatsData = await getMiddleCategories(categoryId);
        setMiddleCategories(middleCatsData.categories);
      } catch (error) {
        console.error('중분류 로드 실패:', error);
        setMiddleCategories([]);
      }
    } else {
      setMiddleCategories([]);
      setMinorCategories([]);
    }
  };

  const handleMiddleCategoryChange = async (middleCategoryId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      middleCategory: middleCategoryId,
      minorCategory: 'all'  // 중분류 변경시 소분류 초기화
    }));
    
    // 소분류 카테고리 로드
    if (middleCategoryId !== 'all') {
      try {
        const minorCatsData = await getMinorCategories(filters.category, middleCategoryId);
        setMinorCategories(minorCatsData.categories);
      } catch (error) {
        console.error('소분류 로드 실패:', error);
        setMinorCategories([]);
      }
    } else {
      setMinorCategories([]);
    }
  };

  const handleMinorCategoryChange = (minorCategoryId: string) => {
    setFilters(prev => ({ ...prev, minorCategory: minorCategoryId }));
  };

  const handlePageChange = (newPage: number) => {
    if (!loading && newPage !== pagination.page) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePlaceClick = (placeId: string) => {
    router.push(`/places/${placeId}`);
  };

  // AI 검색 폼 검증
  const isFormValid = 
    aiSearchForm.description.length >= 20 && 
    aiSearchForm.description.length <= 200 &&
    balance && balance.total_balance >= 300;

  const getDescriptionStatus = () => {
    const length = aiSearchForm.description.length;
    if (length < 20) return { valid: false, message: `${20 - length}자 더 입력해주세요` };
    if (length > 200) return { valid: false, message: `${length - 200}자 초과` };
    return { valid: true, message: `${length}/200자` };
  };

  // AI 검색 실행
  const handleAiSearch = async () => {
    if (!isFormValid) return;
    
    setIsAiSearching(true);
    setAiSearchError(null);
    
    try {
      const token = TokenStorage.get();
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      // 1. 먼저 300 day 결제 처리
      const deductResult = await paymentsApi.deductBalance({
        amount: 300,
        service_type: 'ai_search',
        service_id: `ai_place_search_${Date.now()}`,
        description: 'AI 장소 검색 서비스 이용'
      }, token);

      if (!deductResult.success) {
        throw new Error(deductResult.message || '결제 처리 중 오류가 발생했습니다');
      }

      // 2. 결제 성공 후 AI 검색 실행
      const result = await aiSearchPlaces(aiSearchForm, token);
      setAiSearchResults(result.places);
      setShowAiResults(true);
      
      // 사용자별 localStorage에 AI 검색 상태 저장
      if (currentUser) {
        localStorage.setItem(getUserStorageKey('ai-search-results'), JSON.stringify(result.places));
        localStorage.setItem(getUserStorageKey('show-ai-results'), 'true');
        localStorage.setItem(getUserStorageKey('ai-search-form'), JSON.stringify(aiSearchForm));
      }
      
      // day 즉시 업데이트
      await refreshBalance();
      
      // 성공 토스트
      toast.success(`AI 검색 완료! ${result.places.length}개 장소 발견 (${result.search_time.toFixed(1)}초)`);
    } catch (error: any) {
      setAiSearchError(error.message);
      toast.error(`AI 검색 실패: ${error.message}`);
    } finally {
      setIsAiSearching(false);
    }
  };

  // 일반 검색 시 AI 결과 숨김
  const handleNormalSearch = () => {
    setShowAiResults(false);
    if (currentUser) {
      localStorage.setItem(getUserStorageKey('show-ai-results'), 'false');
    }
    handleSearchSubmit();
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">인기 장소 둘러보기</h1>
            <p className="text-lg text-text-secondary">다른 사용자들이 추천하는 핫플을 확인해보세요 ✨</p>
          </div>
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">인기 장소 둘러보기</h1>
          <p className="text-lg text-text-secondary">
            총 <span className="font-semibold text-primary-pink">{places.length.toLocaleString()}</span>개의 장소가 찾아졌어요 ✨
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
                  className="pl-10 pr-10 bg-white rounded-xl border-gray-200 focus:border-primary-pink h-12"
                  autoComplete="off"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              
              {/* 자동완성 드롭다운 */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto mt-2">
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
                            <div className="w-8 h-8 bg-gradient-to-br from-secondary-pink to-primary-pink rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-white" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {/* 대분류 필터 */}
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink"
              >
                <option value="all">모든 카테고리</option>
                {majorCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* 중분류 필터 */}
              <select
                value={filters.middleCategory}
                onChange={(e) => handleMiddleCategoryChange(e.target.value)}
                disabled={filters.category === 'all' || middleCategories.length === 0}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="all">모든 중분류</option>
                {middleCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* 소분류 필터 */}
              <select
                value={filters.minorCategory}
                onChange={(e) => handleMinorCategoryChange(e.target.value)}
                disabled={filters.middleCategory === 'all' || minorCategories.length === 0}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="all">모든 소분류</option>
                {minorCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* 지역 필터 */}
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink"
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
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink"
              >
                <option value="review_count_desc">후기 많은 순</option>
                <option value="rating_desc">평점 높은 순</option>
                <option value="name">이름순</option>
                <option value="latest">최신 등록순</option>
              </select>

              {/* 평점 필터 */}
              <select
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink"
              >
                <option value={0}>모든 평점</option>
                <option value={3}>3점 이상</option>
                <option value={4}>4점 이상</option>
                <option value={5}>5점만</option>
              </select>

              {/* 고급 필터 */}
              <div className="flex gap-2">
                <label className="flex items-center space-x-2 bg-white px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.hasParking}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasParking: e.target.checked }))}
                    className="text-primary-pink focus:ring-primary-pink border-gray-300 rounded"
                  />
                  <span>주차 가능</span>
                </label>
                <label className="flex items-center space-x-2 bg-white px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                    className="text-primary-pink focus:ring-primary-pink border-gray-300 rounded"
                  />
                  <span>전화번호</span>
                </label>
              </div>
            </div>

            {/* 적용된 필터 표시 */}
            {(filters.category !== 'all' || filters.middleCategory !== 'all' || filters.minorCategory !== 'all' || filters.region !== 'all' || filters.search || filters.minRating > 0 || filters.hasParking || filters.hasPhone) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 font-medium">적용된 필터:</span>
                {filters.category !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.category}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.middleCategory !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    중분류: {filters.middleCategory}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, middleCategory: 'all', minorCategory: 'all' }))}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.minorCategory !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    소분류: {filters.minorCategory}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, minorCategory: 'all' }))}
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
                      sortBy: 'review_count_desc',
                      minRating: 0,
                      hasParking: false,
                      hasPhone: false,
                      middleCategory: 'all',
                      minorCategory: 'all'
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

        {/* AI 검색 섹션 */}
        <div className="mb-8 bg-gradient-to-r from-secondary-pink/20 to-soft-purple/20 rounded-2xl border border-primary-pink/20 overflow-hidden">
          {/* AI 검색 헤더 (항상 표시) */}
          <div 
            className="p-6 cursor-pointer hover:bg-white/50 transition-colors"
            onClick={() => setIsAiSearchOpen(!isAiSearchOpen)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2 flex items-center gap-2">
                  🤖 AI 스마트 검색
                  <span className="text-sm font-normal text-text-secondary">- 자연어로 원하는 장소를 찾아보세요</span>
                </h2>
                <p className="text-sm text-text-secondary">
                  예: "연인과 함께 가기 좋은 분위기 있는 데이트 카페", "인스타 감성의 브런치가 유명한 맛집"
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary-pink">
                <span className="text-sm font-medium">
                  {isAiSearchOpen ? '접기' : '펼치기'}
                </span>
                {isAiSearchOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>

          {/* AI 검색 폼 (토글 가능) */}
          {isAiSearchOpen && (
            <div className="px-6 pb-6 border-t border-primary-pink/20 bg-white/30">
              <div className="space-y-4 mt-4">
                {/* 설명 입력 필드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    찾고 싶은 장소 설명 (20-200자)
                  </label>
                  <textarea
                    value={aiSearchForm.description}
                    onChange={(e) => setAiSearchForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="예: 연인과 함께 가기 좋은 분위기 있는 데이트 카페, 인스타그램 감성의 브런치가 유명한 맛집"
                    className="w-full h-20 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink resize-none"
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${getDescriptionStatus().valid ? 'text-green-600' : 'text-red-600'}`}>
                      {getDescriptionStatus().message}
                    </span>
                  </div>
                </div>

                {/* 구 선택 및 카테고리 선택 */}
                <div className="space-y-4">
                  {/* 구 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">구 선택 (선택사항)</label>
                    <select
                      value={aiSearchForm.district}
                      onChange={(e) => setAiSearchForm(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink"
                    >
                      <option value="전체">전체</option>
                      {SEOUL_DISTRICTS.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>

                  {/* 카테고리 선택 (대중소) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 대분류 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">대분류</label>
                      <select
                        value={aiSearchForm.major_category}
                        onChange={async (e) => {
                          const major = e.target.value;
                          setAiSearchForm(prev => ({ 
                            ...prev, 
                            major_category: major,
                            middle_category: '전체',
                            minor_category: '전체'
                          }));
                          
                          // 중분류 로드
                          if (major !== '전체') {
                            try {
                              const middleCatsData = await getMiddleCategories(major);
                              setMiddleCategories(middleCatsData.categories);
                            } catch (error) {
                              console.error('AI 검색 중분류 로드 실패:', error);
                              setMiddleCategories([]);
                            }
                          } else {
                            setMiddleCategories([]);
                            setMinorCategories([]);
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink"
                      >
                        <option value="전체">전체</option>
                        {majorCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 중분류 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">중분류</label>
                      <select
                        value={aiSearchForm.middle_category}
                        onChange={async (e) => {
                          const middle = e.target.value;
                          setAiSearchForm(prev => ({ 
                            ...prev, 
                            middle_category: middle,
                            minor_category: '전체'
                          }));
                          
                          // 소분류 로드
                          if (middle !== '전체') {
                            try {
                              const minorCatsData = await getMinorCategories(aiSearchForm.major_category, middle);
                              setMinorCategories(minorCatsData.categories);
                            } catch (error) {
                              console.error('AI 검색 소분류 로드 실패:', error);
                              setMinorCategories([]);
                            }
                          } else {
                            setMinorCategories([]);
                          }
                        }}
                        disabled={aiSearchForm.major_category === '전체' || middleCategories.length === 0}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="전체">전체</option>
                        {middleCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 소분류 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">소분류</label>
                      <select
                        value={aiSearchForm.minor_category}
                        onChange={(e) => setAiSearchForm(prev => ({ ...prev, minor_category: e.target.value }))}
                        disabled={aiSearchForm.middle_category === '전체' || minorCategories.length === 0}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-pink focus:border-primary-pink disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="전체">전체</option>
                        {minorCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 검색 버튼 및 day 표시 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleAiSearch}
                      disabled={!isFormValid || isAiSearching}
                      className="bg-primary-pink hover:bg-primary-pink/90 text-white px-6 py-3 rounded-full disabled:opacity-50"
                    >
                      {isAiSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          AI가 장소를 찾고 있습니다...
                        </>
                      ) : (
                        <>
                          🤖 AI 검색 (300 day)
                        </>
                      )}
                    </Button>
                    
                    <div className="text-sm text-text-secondary">
                      day: <span className="font-semibold text-primary-pink">
                        {balance ? balance.total_balance.toLocaleString() : '0'}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 에러 메시지 */}
                {aiSearchError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-700 text-sm">{aiSearchError}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 검색 결과 타입 표시 */}
        {showAiResults && (
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-secondary-pink text-primary-pink">
              🤖 AI 검색 결과
            </Badge>
            <span className="text-sm text-text-secondary">{searchResultTitle}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAiResults(false);
                if (currentUser) {
                  localStorage.setItem(getUserStorageKey('show-ai-results'), 'false');
                }
              }}
              className="text-text-secondary hover:text-text-primary rounded-full"
            >
              일반 검색으로 돌아가기
            </Button>
          </div>
        )}

        {/* 장소 목록 */}
        {displayPlaces.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500 mb-6">다른 검색어를 사용하거나 필터를 변경해보세요</p>
            <Button 
              onClick={() => {
                const resetFilters = { category: 'all', region: 'all', search: '', sortBy: 'review_count_desc', minRating: 0, hasParking: false, hasPhone: false, middleCategory: 'all', minorCategory: 'all' };
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
              {displayPlaces.map((place) => (
                <Card 
                  key={place.place_id} 
                  className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden group"
                  onClick={() => handlePlaceClick(place.place_id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg font-semibold text-text-primary group-hover:text-primary-pink transition-colors line-clamp-1">
                        {place.name}
                      </CardTitle>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-pink group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
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
                        className="text-primary-pink hover:text-primary-pink/80 hover:bg-secondary-pink p-2 rounded-full"
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
            {!showAiResults && totalCount > pagination.limit && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-full border-gray-200 hover:border-primary-pink hover:bg-secondary-pink"
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
                      className={`w-10 h-10 rounded-full ${
                        pagination.page === pageNum 
                          ? "bg-primary-pink hover:bg-primary-pink/90 text-white" 
                          : "border-gray-200 hover:border-primary-pink hover:bg-secondary-pink"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(totalCount / pagination.limit)}
                  className="rounded-full border-gray-200 hover:border-primary-pink hover:bg-secondary-pink"
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