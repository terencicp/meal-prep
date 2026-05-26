import React from "react";

export default function ShoppingPriceTracker() {
  const supermarkets = [
    {
      id: 1,
      name: "Budget Basket",
      distance: "1.1 mi",
      price: 62.4,
      change: -4.1,
      badge: "Best overall",
    },
    {
      id: 2,
      name: "Freshline Market",
      distance: "2.5 mi",
      price: 64.2,
      change: -2.3,
      badge: "Best produce",
    },
    {
      id: 3,
      name: "Neighborhood Grocer",
      distance: "0.9 mi",
      price: 65.1,
      change: -1.2,
      badge: "Closest",
    },
    {
      id: 4,
      name: "Harbor Foods",
      distance: "3.2 mi",
      price: 66.8,
      change: 0.5,
      badge: "Popular",
    },
    {
      id: 5,
      name: "City Pantry",
      distance: "1.7 mi",
      price: 67.5,
      change: 1.1,
      badge: "Stable",
    },
    {
      id: 6,
      name: "Greenway Market",
      distance: "4.4 mi",
      price: 69.3,
      change: 2.9,
      badge: "Organic",
    },
    {
      id: 7,
      name: "Value Vault",
      distance: "5.1 mi",
      price: 70.2,
      change: 1.8,
      badge: "Bulk deals",
    },
    {
      id: 8,
      name: "Sunrise Foods",
      distance: "2.9 mi",
      price: 72.6,
      change: 3.4,
      badge: "Fast checkout",
    },
    {
      id: 9,
      name: "Metro Mart",
      distance: "6.2 mi",
      price: 74.9,
      change: 4.2,
      badge: "Largest variety",
    },
  ];

  const prices = supermarkets.map((store) => store.price);
  const maxPrice = Math.max(...prices);
  const spread = Math.max(maxPrice, 0.1);

  return (
    <div className='w-full max-w-md mx-auto space-y-5 px-3 sm:px-0'>
      <div className='bg-white border-4 border-black shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] flex flex-col'>
        <div className='px-4 py-3 border-b-4 border-black bg-[#FFD600]'>
          <h3 className='font-black uppercase tracking-wide text-black text-xl'>
            Best deals
          </h3>
        </div>
        <div className='flex flex-col'>
          {supermarkets.map((store, index) => {
            const rank = index + 1;
            const score = (store.price / spread) * 100;

            return (
              <div
                key={store.id}
                className='border-b-4 border-black last:border-b-0 bg-white px-4 py-5 hover:bg-[#FFFBE6] transition-colors flex items-start gap-4'
              >
                <div className='w-10 h-10 shrink-0 border-4 border-black text-black font-black flex items-center justify-center text-lg'>
                  {rank}
                </div>

                <div className='flex-1 min-w-0 h-10 flex flex-col justify-between'>
                  <div className='flex items-baseline justify-between leading-none'>
                    <p className='font-black uppercase tracking-wide text-base text-black truncate leading-none'>
                      {store.name}
                    </p>
                    <p className='text-base font-black text-black ml-2 whitespace-nowrap leading-none'>
                      {store.price.toFixed(2)}€
                    </p>
                  </div>
                  <div className='w-full h-4 border-2 border-black bg-white'>
                    <div
                      className='h-full bg-black'
                      style={{ width: `${Math.max(12, score)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
