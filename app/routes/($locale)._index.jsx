import React, { useEffect, useRef } from 'react';
import { defer } from '@shopify/remix-oxygen';
import { Await, useLoaderData, Link } from '@remix-run/react';
import { Suspense } from 'react';
import { Image, Money } from '@shopify/hydrogen';

export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};

export async function loader({ context }) {
  const { storefront } = context;
  const { collections: collection } = await storefront.query(FEATURED_COLLECTION_QUERY);
  const { collections } = await storefront.query(FEATURED_COLLECTIONS_QUERY);
  const featuredCollection = collection.nodes[0];
  const featuredCollections = collections;
  const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

  return defer({ featuredCollection, featuredCollections, recommendedProducts });
}

export default function Homepage() {
  const data = useLoaderData();

  return (
    <div className="home">
      <FeaturedCollections collections={data.featuredCollections} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

function FeaturedCollections({ collections }) {
  const nextRef = useRef(null);
  const prevRef = useRef(null);
  const carouselRef = useRef(null);
  const sliderRef = useRef(null);
  const thumbnailBorderRef = useRef(null);

  useEffect(() => {
    const nextDom = nextRef.current;
    const prevDom = prevRef.current;
    const carouselDom = carouselRef.current;
    const sliderDom = sliderRef.current;
    const thumbnailBorderDom = thumbnailBorderRef.current;

    let runTimeOut;
    let runNextAuto = setTimeout(() => {
      nextDom.click();
    }, 7000);

    const showSlider = (type) => {
      const sliderItemsDom = sliderDom.querySelectorAll('.item');
      const thumbnailItemsDom = thumbnailBorderDom.querySelectorAll('.item');

      if (type === 'next') {
        sliderDom.appendChild(sliderItemsDom[0]);
        thumbnailBorderDom.appendChild(thumbnailItemsDom[0]);
        carouselDom.classList.add('next');
      } else {
        sliderDom.prepend(sliderItemsDom[sliderItemsDom.length - 1]);
        thumbnailBorderDom.prepend(thumbnailItemsDom[thumbnailItemsDom.length - 1]);
        carouselDom.classList.add('prev');
      }

      clearTimeout(runTimeOut);
      runTimeOut = setTimeout(() => {
        carouselDom.classList.remove('next');
        carouselDom.classList.remove('prev');
      }, 3000);

      clearTimeout(runNextAuto);
      runNextAuto = setTimeout(() => {
        nextDom.click();
      }, 7000);
    };

    nextDom.onclick = () => showSlider('next');
    prevDom.onclick = () => showSlider('prev');

    return () => {
      clearTimeout(runTimeOut);
      clearTimeout(runNextAuto);
      nextDom.onclick = null;
      prevDom.onclick = null;
    };
  }, []);

  return (
    <div className='carousel' ref={carouselRef}>
      <div className='list' ref={sliderRef}>
        {collections.nodes.map((collection, index) => (
          <div className='item' key={index}>
            <img src={collection.image?.url} alt='' />
            <div className='content'>
              <div className='title'>{collection.title || 'Placeholder Title'}</div>
              <div className='buttons'>
                <button>view collection</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='thumbnail' ref={thumbnailBorderRef}>
        {collections.nodes.map((collection, index) => (
          <div className="item" key={index}>
            <img src={collection.image?.url} alt='' />
            <div className="content">
              <div className="title">Name Slider</div>
              <div className="description">Description</div>
            </div>
          </div>
        ))}
      </div>
      <div className="arrows">
        <button id="prev" ref={prevRef}>prev</button>
        <button id="next" ref={nextRef}>next</button>
      </div>
    </div>
  );
}


function RecommendedProducts({ products }) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({ products }) => (
            <div className="recommended-products-grid">
              {products.nodes.map((product) => (
                <Link key={product.id} className="recommended-product" to={`/products/${product.handle}`}>
                  <Image data={product.images.nodes[0]} aspectRatio="1/1" sizes="(min-width: 45em) 20vw, 50vw" />
                  <h4>{product.title}</h4>
                  <small>
                    <Money data={product.priceRange.minVariantPrice} />
                  </small>
                </Link>
              ))}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const FEATURED_COLLECTIONS_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 3, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */



// import {defer} from '@shopify/remix-oxygen';
// import {Await, useLoaderData, Link} from '@remix-run/react';
// import {Suspense} from 'react';
// import {Image, Money} from '@shopify/hydrogen';

// /**
//  * @type {MetaFunction}
//  */
// export const meta = () => {
//   return [{title: 'Hydrogen | Home'}];
// };

// /**
//  * @param {LoaderFunctionArgs}
//  */
// export async function loader({context}) {
//   const {storefront} = context;
//   const {collections:collection} = await storefront.query(FEATURED_COLLECTION_QUERY);
//   const {collections} = await storefront.query(FEATURED_COLLECTIONS_QUERY);
//   const featuredCollection = collection.nodes[0];
//   const featuredCollections = collections;
//   const recommendedProducts = storefront.query(RECOMMENDED_PRODUCTS_QUERY);

//   return defer({featuredCollection, featuredCollections, recommendedProducts});
// }

// export default function Homepage() {
//   /** @type {LoaderReturnData} */
//   const data = useLoaderData();
//   //console.log(data, "here")
//   return (
//     <div className="home">
//       {/**data.featuredCollections.nodes.map((collections, index) => (
//         <FeaturedCollections key={index} collection={collections} />
//       ))*/}
//       <FeaturedCollections collections={data.featuredCollections}/>
//       {/*<FeaturedCollection collection={data.featuredCollection} />*/}
//       <RecommendedProducts products={data.recommendedProducts} />
//     </div>
//   );
// }

// /**
//  * @param {{
//  *   collection: FeaturedCollectionFragment;
//  * }}
//  */

// function FeaturedCollection({collection}) {
//  // console.log(collection)
//   if (!collection) return null;
//   const image = collection?.image;
//   return (
//     <Link
//       className="featured-collection"
//       to={`/collections/${collection.handle}`}
//     >
//       {image && (
//         <div className="featured-collection-image">
//           <Image data={image} sizes="100vw" />
//         </div>
//       )}
//       <h1>{collection.title}</h1>
//     </Link>
//   );
// }

// //Begin 
// /**
//  * 
//  * @param {{
//  *  collections: FeaturedCollectionFragment[]; 
//  * }}
//  */

// function FeaturedCollections({collections}){
//   // const image = collections.nodes[1]?.image;
//   // console.log(image)
//   return (
//     <div className='container'>
//       <div className='carousel'>
//         <div className='list'>
//           {collections.nodes.map((collection, index) => (
//             <div className='item' key={index}>
//               <img src={collection.image?.url || image.url} alt='' />
//               <div className='content'>
//                 <div className='title'>{collection.title || 'Placeholder Title'}</div>
//                 <div className='buttons'>
//                   <button>view collection</button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className='thumbnails'>
//           {collections.nodes.map((collection, index)=>{
//             console.log(collection.image.url)
//             return(
//               <div className="item" key={index}>
//                 <img src={collection.image.url}/>
//                 <div className="content">
//                     <div className="title">
//                         Name Slider
//                     </div>
//                     <div className="description">
//                         Description
//                     </div>
//                 </div>
//             </div>
//             )
//           })}

//         </div>
//         <div className="arrows">
//             <button id="prev">prev</button>
//             <button id="next">next</button>
//         </div>
      
//         <div className="time"></div>
//       </div>
//     </div>
//   );
  
//   // return(
//   //   <div className='container'>
//   //     <div className='carousel'>
//   //       <div className='list'>
//   //         <div className='item'>
//   //           <img src={image.url}alt='' />
//   //           <div className='content'>
//   //             <div className='title' > place holder</div>
//   //             <div className='buttons'>
//   //               <button>view collection</button>
//   //             </div>
//   //           </div>
//   //         </div>
//   //       </div>
//   //       {/** 
//   //         collections.nodes.map((collection, index) => (
//   //           <FeaturedCollection className='feature' key={index} collection={collection} />
//   //         ))
//   //         //console.log("here are the collections ", collections.nodes)
//   //       */}
//   //     </div>
//   //   </div>
//   // )
  
// }
// //End

// /**
//  * @param {{
//  *   products: Promise<RecommendedProductsQuery>;
//  * }}
//  */
// function RecommendedProducts({products}) {
//   return (
//     <div className="recommended-products">
//       <h2>Recommended Products</h2>
//       <Suspense fallback={<div>Loading...</div>}>
//         <Await resolve={products}>
//           {({products}) => (
//             <div className="recommended-products-grid">
//               {products.nodes.map((product) => (
//                 <Link
//                   key={product.id}
//                   className="recommended-product"
//                   to={`/products/${product.handle}`}
//                 >
//                   <Image
//                     data={product.images.nodes[0]}
//                     aspectRatio="1/1"
//                     sizes="(min-width: 45em) 20vw, 50vw"
//                   />
//                   <h4>{product.title}</h4>
//                   <small>
//                     <Money data={product.priceRange.minVariantPrice} />
//                   </small>
//                 </Link>
//               ))}
//             </div>
//           )}
//         </Await>
//       </Suspense>
//       <br />
//     </div>
//   );
// }

// // Begin Graphql Fetch
// const FEATURED_COLLECTIONS_QUERY =`#graphql
//   fragment FeaturedCollection on Collection {
//     id
//     title
//     image {
//       id
//       url
//       altText
//       width
//       height
//     }
//     handle
//   }
//   query FeaturedCollections($country: CountryCode, $language: LanguageCode)
//   @inContext(country: $country, language: $language) {
//   collections(first: 3, sortKey: UPDATED_AT, reverse: true) {
//     nodes {
//       ...FeaturedCollection
//     }
//   }
//   }
// `;
// //// End Graphql Fetch
// const FEATURED_COLLECTION_QUERY = `#graphql
//   fragment FeaturedCollection on Collection {
//     id
//     title
//     image {
//       id
//       url
//       altText
//       width
//       height
//     }
//     handle
//   }
//   query FeaturedCollection($country: CountryCode, $language: LanguageCode)
//     @inContext(country: $country, language: $language) {
//     collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
//       nodes {
//         ...FeaturedCollection
//       }
//     }
//   }
// `;

// const RECOMMENDED_PRODUCTS_QUERY = `#graphql
//   fragment RecommendedProduct on Product {
//     id
//     title
//     handle
//     priceRange {
//       minVariantPrice {
//         amount
//         currencyCode
//       }
//     }
//     images(first: 1) {
//       nodes {
//         id
//         url
//         altText
//         width
//         height
//       }
//     }
//   }
//   query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
//     @inContext(country: $country, language: $language) {
//     products(first: 4, sortKey: UPDATED_AT, reverse: true) {
//       nodes {
//         ...RecommendedProduct
//       }
//     }
//   }
// `;

// /** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
// /** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
// /** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
// /** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
// /** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
