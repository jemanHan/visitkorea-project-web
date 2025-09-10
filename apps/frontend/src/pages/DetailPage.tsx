import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/http.js'
import { isAuthenticated } from '../api/auth.js'
import { checkLikeStatus, addLike, removeLike } from '../api/likes.js'
import DateSelectModal from '../components/schedule/DateSelectModal'

type SortOption = 'relevance' | 'latest';

type Review = {
  author?: {
    displayName?: string
  }
  rating?: number
  text?: string | { text: string }
  relativePublishTimeDescription?: string
  publishTime?: string
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
  reviewCount?: number
  photoCount?: number
  isLocalGuide?: boolean
}

type PlaceDetails = {
  id: string
  displayName: any
  rating?: number
  userRatingCount?: number
  websiteUri?: string
  internationalPhoneNumber?: string
  formattedPhoneNumber?: string
  formattedAddress?: string
  openingHours?: {
    weekdayDescriptions?: string[]
  }
  businessStatus?: string
  priceLevel?: string
  editorialSummary?: any
  photos?: { name: string; widthPx?: number; heightPx?: number }[]
  reviews?: Review[]
  location?: { latitude: number; longitude: number }
  categories?: string[]
  types?: string[]
}

const MOCK_DETAIL: PlaceDetails = {
  id: 'mock-1',
  displayName: { text: '모의 여행지 A' },
  rating: 4.6,
  userRatingCount: 128,
  editorialSummary: { text: '백엔드 없이도 보이는 상세 설명 예시입니다.' },
  websiteUri: 'https://example.com',
  photos: [{ name: 'https://picsum.photos/seed/a/1200/800' }],
  reviews: [
    { author: { displayName: '홍길동' }, rating: 5, text: '정말 좋았어요!', relativePublishTimeDescription: '2 days ago' },
    { author: { displayName: '김철수' }, rating: 4, text: '가볼만 합니다.', relativePublishTimeDescription: '1 week ago' }
  ]
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PlaceDetails | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>('relevance')
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set())
  const [liked, setLiked] = useState(false)
  const [likedLoading, setLikedLoading] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)

  useEffect(() => {
    if (id) {
      void fetchDetail(id)
      void checkLikeStatusOnMount(id)
    }
  }, [id])

  async function checkLikeStatusOnMount(placeId: string) {
    if (!isAuthenticated()) return;
    
    try {
      const status = await checkLikeStatus(placeId);
      setLiked(status.liked);
    } catch (error) {
      console.error('Check like status error:', error);
    }
  }

  async function fetchDetail(placeId: string) {
    try {
      const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3002";
      const url = new URL(`/v1/places/${encodeURIComponent(placeId)}`, base);
      
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      // Backend now returns mapped data, just use it directly
      setData(json);
    } catch (error) {
      // Use fallback description from sessionStorage if available
      const fallbackDesc = sessionStorage.getItem(`fallback-desc:${placeId}`);
      if (fallbackDesc) {
        setData({ ...MOCK_DETAIL, editorialSummary: fallbackDesc });
      } else {
        setData(MOCK_DETAIL);
      }
    }
  }

  async function handleLike() {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!data || !id) return;

    setLikedLoading(true);
    try {
      if (liked) {
        // 좋아요 취소
        await removeLike(id);
        setLiked(false);
      } else {
        // 좋아요 추가
        const raw = data.categories ?? data.types ?? [];
        const tags = Array.from(new Set(raw.map(t => String(t).toLowerCase().trim()))).slice(0, 8);

        await addLike({
          placeId: id,
          name: typeof data.displayName === 'object' ? data.displayName?.text : data.displayName,
          address: data.formattedAddress,
          rating: data.rating,
          tags: tags as string[]
        });

        setLiked(true);
      }
    } catch (error) {
      console.error('Like error:', error);
      alert(liked ? '좋아요 취소에 실패했습니다.' : '좋아요 저장에 실패했습니다.');
    } finally {
      setLikedLoading(false);
    }
  }

  function handleAddToSchedule() {
    setShowDateModal(true)
  }

  function handleDateSelect(date: Date) {
    const placeName = data?.displayName?.text || '장소'
    const dateString = date.toISOString().split('T')[0]
    navigate(`/schedule?place=${encodeURIComponent(placeName)}&date=${dateString}`)
  }

  if (!data) return <div className="p-8">불러오는 중...</div>

  const placeName = typeof data.displayName === 'object' ? data.displayName?.text : data.displayName ?? '이름 없음';

  return (
    <div className="container px-4 py-8 mx-auto relative">
      {/* 뒤로가기 버튼 - 우측 상단 고정 */}
      <button
        onClick={() => navigate(-1)}
        className="fixed right-4 z-40 btn btn-circle btn-sm bg-white/90 backdrop-blur shadow-lg hover:bg-white"
        style={{ top: '6rem' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      
      <div className="shadow-xl card bg-base-100">
        {/* Main Photo with Hover Effect */}
        {data.photos && data.photos.length > 0 && (
          <figure className="relative">
            <div 
              className="w-full transition-transform duration-300 cursor-pointer h-[500px] hover:scale-[1.02]"
              onClick={() => {
                setShowPhotoModal(true)
                setCurrentPhotoIndex(0)
              }}
            >
              {(() => {
                const photo = data.photos![0]; // 첫 번째 사진만 사용
                const photoEl = /^https?:\/\//.test(photo.name)
                  ? <img src={photo.name} alt={placeName} className="object-cover w-full h-full" />
                  : (() => {
                      const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3002";
                      const url = new URL(`/v1/places/${encodeURIComponent(data.id)}/photos/media`, base);
                      url.searchParams.set("name", photo.name);
                      url.searchParams.set("maxWidthPx", "1200");
                      return <img src={url.toString()} alt={placeName} className="object-cover w-full h-full" />;
                    })();
                
                return photoEl;
              })()}
            </div>
            <div className="absolute z-10 px-3 py-1 text-sm text-white bg-black bg-opacity-50 rounded-full bottom-4 left-4">
              이미지 더보기 
            </div>
          </figure>
        )}
        
        <div className="card-body">
          {/* Header with rating */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl card-title">{placeName}</h1>
            <div className="flex items-center gap-2">
              <div className="rating rating-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                  <input
                    key={star}
                    type="radio"
                    name={`rating-${data.id}`}
                    className="bg-orange-400 mask mask-star-2"
                    checked={data.rating ? Math.round(data.rating) === star : false}
                    readOnly
                  />
                ))}
              </div>
              <span className="text-sm opacity-80">
                {data.rating?.toFixed(1) ?? '-'} ({data.userRatingCount?.toLocaleString() ?? 0}개 리뷰)
              </span>
            </div>
          </div>

          {/* Business Status */}
          {data.businessStatus && (
            <div className="badge badge-outline">
              {data.businessStatus === 'OPERATIONAL' ? '영업중' : 
               data.businessStatus === 'CLOSED_TEMPORARILY' ? '임시휴업' : 
               data.businessStatus === 'CLOSED_PERMANENTLY' ? '영구폐업' : data.businessStatus}
            </div>
          )}
          
          {/* Address with Map Link */}
          {data.formattedAddress && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm opacity-80">📍 {data.formattedAddress}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 mt-4">
            {data.formattedPhoneNumber && (
              <a 
                href={`tel:${data.formattedPhoneNumber}`}
                className="flex items-center gap-2 text-sm link link-primary"
              >
                📞 {data.formattedPhoneNumber}
              </a>
            )}
            {data.websiteUri && (
              <a 
                href={data.websiteUri} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-sm link link-primary"
              >
                🌐 웹사이트
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleLike}
              disabled={likedLoading}
              className={`btn btn-sm ${liked ? 'btn-success' : 'btn-outline'}`}
            >
              {likedLoading ? '💾 처리 중...' : liked ? '❤️ 좋아요 완료' : '🤍 좋아요'}
            </button>
            <button 
              onClick={handleAddToSchedule}
              className="btn btn-primary btn-sm"
            >
              📅 스케줄에 추가
            </button>
          </div>

          {/* Opening Hours */}
          {data.openingHours?.weekdayDescriptions && data.openingHours.weekdayDescriptions.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 font-semibold">영업시간</h3>
              <ul className="space-y-1 text-sm">
                {data.openingHours.weekdayDescriptions.map((day, index) => {
                  // 현재 요일 확인 (0=일요일, 1=월요일, ..., 6=토요일)
                  const today = new Date().getDay();
                  // Google Places API는 월요일부터 시작하므로 인덱스 조정
                  const isToday = (today === 0 ? 6 : today - 1) === index;
                  
                  return (
                    <li 
                      key={index} 
                      className={`flex items-center gap-2 ${
                        isToday 
                          ? 'font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded' 
                          : 'opacity-80'
                      }`}
                    >
                      {day}
                      {isToday && (
                        <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                          오늘
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Price Level */}
          {data.priceLevel && (
            <div className="mt-2">
              <span className="text-sm opacity-80">가격대: {'💰'.repeat(Number(data.priceLevel))}</span>
            </div>
          )}
          
          {/* Description */}
          {data.editorialSummary && (
            <div className="mt-4">
              <h3 className="mb-2 font-semibold">설명</h3>
              <p className="text-sm opacity-80">
                {typeof data.editorialSummary === 'object' ? data.editorialSummary.text : data.editorialSummary}
              </p>
            </div>
          )}
          
          {/* Review Summary */}
          {data.reviews && data.reviews.length > 0 && (
            <div className="p-6 mt-6 bg-gray-900 rounded-lg">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Google 리뷰 요약</h2>
              </div>

              <div className="flex items-center gap-8">
                {/* Rating Distribution */}
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = data.reviews?.filter(r => r.rating === star).length || 0;
                    const percentage = data.reviews ? (count / data.reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 mb-1">
                        <span className="w-4 text-sm text-white">{star}</span>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full">
                          <div 
                            className="h-2 transition-all duration-300 bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Rating */}
                <div className="text-center">
                  <div className="mb-1 text-3xl font-bold text-white">
                    {data.rating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-white">
                    리뷰 {data.userRatingCount?.toLocaleString() || 0}개
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Reviews */}
          {data.reviews && data.reviews.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">리뷰</h2>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      sortOption === 'relevance' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setSortOption('relevance')}
                  >
                    관련성순
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      sortOption === 'latest' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setSortOption('latest')}
                  >
                    최신순
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                                {(() => {
                  let sortedReviews = [...data.reviews];
                  if (sortOption === 'latest') {
                    // 최신순 정렬 (publishTime 기준)
                    sortedReviews.sort((a, b) => {
                      const timeA = a.publishTime ? new Date(a.publishTime).getTime() : 0;
                      const timeB = b.publishTime ? new Date(b.publishTime).getTime() : 0;
                      return timeB - timeA;
                    });
                  } else {
                    // 관련성순 정렬 (별점 높은 순, 같으면 최신순)
                    sortedReviews.sort((a, b) => {
                      const ratingA = a.rating || 0;
                      const ratingB = b.rating || 0;
                      if (ratingB !== ratingA) return ratingB - ratingA;
                      
                      // 별점이 같으면 최신순으로 정렬
                      const timeA = a.publishTime ? new Date(a.publishTime).getTime() : 0;
                      const timeB = b.publishTime ? new Date(b.publishTime).getTime() : 0;
                      return timeB - timeA;
                    });
                  }
                  
                  return (
                    <>
                                            {sortedReviews.map((review, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-base-50">
                      {/* Author Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {review.author?.displayName || review.authorAttribution?.displayName || 'Anonymous'}
                            </span>
                            {review.isLocalGuide && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                지역 가이드
                              </span>
                            )}
                          </div>
                          
                          {/* Author Stats */}
                          <div className="flex items-center gap-4 mb-2 text-xs text-gray-600">
                            {review.reviewCount && (
                              <span>리뷰 {review.reviewCount}개</span>
                            )}
                            {review.photoCount && (
                              <span>사진 {review.photoCount}장</span>
                            )}
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <div className="rating rating-xs">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <input
                                  key={star}
                                  type="radio"
                                  name={`review-rating-${i}`}
                                  className="bg-orange-400 mask mask-star-2"
                                  checked={review.rating === star}
                                  readOnly
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {review.rating?.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="text-xs text-right text-gray-500">
                          {review.relativePublishTimeDescription}
                        </div>
                      </div>
                      
                      {/* Review Text */}
                      {(() => {
                        const reviewText = typeof review.text === 'object' ? review.text.text : review.text || '';
                        const isExpanded = expandedReviews.has(i);
                        const shouldTruncate = reviewText.length > 150;
                        const displayText = shouldTruncate && !isExpanded 
                          ? reviewText.substring(0, 150) + '...' 
                          : reviewText;
                        
                        return (
                          <div>
                            <p className="text-sm leading-relaxed text-gray-800">
                              {displayText}
                            </p>
                            {shouldTruncate && (
                              <button
                                className="mt-2 text-sm text-blue-600 transition-colors hover:text-blue-800"
                                onClick={() => {
                                  const newExpanded = new Set(expandedReviews);
                                  if (isExpanded) {
                                    newExpanded.delete(i);
                                  } else {
                                    newExpanded.add(i);
                                  }
                                  setExpandedReviews(newExpanded);
                                }}
                              >
                                {isExpanded ? '접기' : '더보기'}
                                                            </button>
                            )}
                          </div>
                        );
                      })()}
                        </div>
                      ))}
                      
                      {/* Google Places 링크 - 더 많은 리뷰와 사진 보기 */}
                      {sortedReviews.length > 0 && (
                        <div className="flex justify-center mt-6">
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(placeName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Google Maps에서 더 많은 리뷰와 사진 보기
                          </a>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal - Google Style */}
      {showPhotoModal && data.photos && data.photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-4">
              <button
                className="p-2 text-white transition-colors rounded-full hover:bg-white/10"
                onClick={() => setShowPhotoModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="text-white">
                <div className="font-medium">{placeName}</div>
                <div className="text-sm text-gray-300">
                  {currentPhotoIndex + 1} / {data.photos.length}
                </div>
              </div>
            </div>
            <div className="text-sm text-white">
              저작권 보호를 받는 이미지일 수 있습니다.
            </div>
          </div>

          {/* Main Content */}
          <div className="flex h-full">
            {/* Left Sidebar - Thumbnails */}
            <div className="w-64 p-4 overflow-y-auto bg-gray-900">
              <div className="grid grid-cols-2 gap-2">
                {data.photos.map((photo, index) => (
                  <button
                    key={index}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex 
                        ? 'border-blue-500 ring-2 ring-blue-500' 
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                    onClick={() => setCurrentPhotoIndex(index)}
                  >
                    {(() => {
                      const thumbnailEl = /^https?:\/\//.test(photo.name)
                        ? <img src={photo.name} alt={`썸네일 ${index + 1}`} className="object-cover w-full h-full" />
                        : (() => {
                            const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3002";
                            const url = new URL(`/v1/places/${encodeURIComponent(data.id)}/photos/media`, base);
                            url.searchParams.set("name", photo.name);
                            url.searchParams.set("maxWidthPx", "200");
                            return <img src={url.toString()} alt={`썸네일 ${index + 1}`} className="object-cover w-full h-full" />;
                          })();
                      
                      return thumbnailEl;
                    })()}
                    
                    {/* Video indicator - removed for now */}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Image Area */}
            <div className="relative flex items-center justify-center flex-1">
              {/* Main Photo */}
              <div className="relative max-w-full max-h-full">
                {(() => {
                  const photo = data.photos![currentPhotoIndex];
                  const photoEl = /^https?:\/\//.test(photo.name)
                    ? <img src={photo.name} alt={`${placeName} ${currentPhotoIndex + 1}`} className="max-w-full max-h-[90vh] object-contain" />
                    : (() => {
                        const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3002";
                        const url = new URL(`/v1/places/${encodeURIComponent(data.id)}/photos/media`, base);
                        url.searchParams.set("name", photo.name);
                        url.searchParams.set("maxWidthPx", "1200");
                        return <img src={url.toString()} alt={`${placeName} ${currentPhotoIndex + 1}`} className="max-w-full max-h-[90vh] object-contain" />;
                      })();
                  
                  return photoEl;
                })()}
              </div>

              {/* Navigation Arrows */}
              <button
                className="absolute p-3 text-white transition-colors transform -translate-y-1/2 rounded-full left-4 top-1/2 bg-black/50 hover:bg-black/70"
                onClick={() => setCurrentPhotoIndex(currentPhotoIndex === 0 ? data.photos!.length - 1 : currentPhotoIndex - 1)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute p-3 text-white transition-colors transform -translate-y-1/2 rounded-full right-4 top-1/2 bg-black/50 hover:bg-black/70"
                onClick={() => setCurrentPhotoIndex(currentPhotoIndex === data.photos!.length - 1 ? 0 : currentPhotoIndex + 1)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 선택 모달 */}
      <DateSelectModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onDateSelect={handleDateSelect}
        placeName={placeName}
      />
    </div>
  )
}


