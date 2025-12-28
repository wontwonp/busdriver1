import React, { useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import ImageWithFallback from './ImageWithFallback'
import 'swiper/css'
import 'swiper/css/navigation'
import './BannerSlider.css'

const BannerSlider = () => {
  const banners = []

  // 배너가 없으면 아무것도 렌더링하지 않음
  if (banners.length === 0) {
    return null
  }

  return (
    <section className="banner-section">
      <Swiper
        modules={[Navigation, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="banner-swiper"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <a href="#banner" className="banner-link">
              <ImageWithFallback
                src={banner}
                alt={`배너 ${index + 1}`}
                fallbackText={`배너 ${index + 1}`}
                className="banner-image"
                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

export default BannerSlider

