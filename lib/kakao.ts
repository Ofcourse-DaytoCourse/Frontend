// lib/kakao.ts

export function handleKakaoLogin() {
  const REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!REST_API_KEY || !REDIRECT_URI) {
    console.error("카카오 API 키 또는 리디렉트 URI가 누락되었습니다.");
    return;
  }

  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;
  window.location.href = KAKAO_AUTH_URL;
}

// 좌표를 주소로 변환하는 함수
export async function convertCoordinatesToAddress(coordinates: {latitude: number, longitude: number} | null): Promise<string | null> {
  if (!coordinates?.latitude || !coordinates?.longitude) {
    return null;
  }

  const REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  if (!REST_API_KEY) {
    console.error("카카오 API 키가 누락되었습니다.");
    return `위도: ${coordinates.latitude}, 경도: ${coordinates.longitude}`;
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${coordinates.longitude}&y=${coordinates.latitude}`,
      {
        headers: {
          'Authorization': `KakaoAK ${REST_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const address = data.documents[0].address;
      if (address) {
        return address.address_name || address.region_3depth_name || `위도: ${coordinates.latitude}, 경도: ${coordinates.longitude}`;
      }
    }
    
    return `위도: ${coordinates.latitude}, 경도: ${coordinates.longitude}`;
  } catch (error) {
    console.error("주소 변환 실패:", error);
    return `위도: ${coordinates.latitude}, 경도: ${coordinates.longitude}`;
  }
}
