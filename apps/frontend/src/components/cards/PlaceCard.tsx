import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = { 
  title: string; 
  imageUrl: string; 
  rating?: number; 
  reviews?: number; 
  href?: string; 
  tag?: string; 
};

export default function PlaceCard({ title, imageUrl, rating, reviews, href = '#', tag }: Props) {
  const { t } = useTranslation();
  return (
    <a href={href} className="card hover:-translate-y-1 hover:shadow-lg transition">
      <div className="overflow-hidden rounded-2xl">
        <img src={imageUrl} alt={title} className="aspect-[4/3] w-full object-cover" />
      </div>
      <div className="card-pad">
        {tag ? <span className="badge mb-3">{tag}</span> : null}
        <h3 className="font-bold text-lg md:text-xl">{title}</h3>
        {(rating !== undefined) ? (
          <p className="mt-1 text-gray-600 dark:text-white text-sm">{rating.toFixed(1)} • {reviews ?? 0} {t('reviews')}</p>
        ) : null}
      </div>
    </a>
  );
}
