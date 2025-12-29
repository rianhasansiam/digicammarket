'use client';

/**
 * Structured Data Component for SEO
 * Implements JSON-LD Schema.org markup for better search engine visibility
 */

export default function StructuredData({ type, data }) {
  if (!type || !data) return null;

  const generateStructuredData = () => {
    switch (type) {
      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: data.name || 'Digicam Market',
          url: data.url || 'https://digicammarket.com',
          logo: data.logo || 'https://digicammarket.com/logo.png',
          description: data.description || 'Premium camera store offering professional photography equipment',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: data.phone || '+1-800-DIGICAM',
            contactType: 'customer service',
            areaServed: 'Worldwide',
            availableLanguage: ['English']
          },
          sameAs: data.socialMedia || [
            'https://facebook.com/digicammarket',
            'https://twitter.com/digicammarket',
            'https://instagram.com/digicammarket'
          ]
        };

      case 'product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.name,
          description: data.description || data.shortDescription,
          image: data.images?.[0] || data.image,
          brand: {
            '@type': 'Brand',
            name: data.brand || data.category
          },
          offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: 'BDT',
            availability: data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://digicammarket.com/products/${data._id || data.id}`,
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          aggregateRating: data.rating ? {
            '@type': 'AggregateRating',
            ratingValue: data.rating,
            reviewCount: data.reviewCount || 1,
            bestRating: '5',
            worstRating: '1'
          } : undefined,
          sku: data._id || data.id,
          category: data.category
        };

      case 'breadcrumb':
        return {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: data.items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url ? `https://digicammarket.com${item.url}` : undefined
          }))
        };

      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: data.name || 'Digicam Market',
          url: data.url || 'https://digicammarket.com',
          description: data.description || 'Premium camera and photography equipment store',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://digicammarket.com/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          }
        };

      case 'review':
        return {
          '@context': 'https://schema.org',
          '@type': 'Review',
          itemReviewed: {
            '@type': 'Product',
            name: data.productName
          },
          author: {
            '@type': 'Person',
            name: data.customerName
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: data.rating,
            bestRating: '5',
            worstRating: '1'
          },
          reviewBody: data.comment,
          datePublished: data.date || data.createdAt
        };

      case 'localBusiness':
        return {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': 'https://digicammarket.com',
          name: 'Digicam Market',
          image: 'https://digicammarket.com/logo.png',
          url: 'https://digicammarket.com',
          telephone: data.phone || '+1-800-DIGICAM',
          priceRange: '$$-$$$',
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.address?.street || '123 Camera Street',
            addressLocality: data.address?.city || 'Dhaka',
            addressRegion: data.address?.region || 'Dhaka',
            postalCode: data.address?.zip || '1000',
            addressCountry: 'BD'
          },
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '18:00'
            },
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: 'Saturday',
              opens: '10:00',
              closes: '16:00'
            }
          ]
        };

      case 'ecommerce':
        return {
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: 'Digicam Market',
          url: 'https://digicammarket.com',
          description: 'Professional cameras and photography equipment',
          image: 'https://digicammarket.com/logo.png',
          priceRange: '$$-$$$',
          paymentAccepted: 'Cash, Credit Card, Debit Card, Online Payment',
          currenciesAccepted: 'BDT, USD'
        };

      default:
        return null;
    }
  };

  const structuredData = generateStructuredData();

  if (!structuredData) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Helper component for multiple structured data items
export function MultipleStructuredData({ items }) {
  return (
    <>
      {items.map((item, index) => (
        <StructuredData key={index} type={item.type} data={item.data} />
      ))}
    </>
  );
}
