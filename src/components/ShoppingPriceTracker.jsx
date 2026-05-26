import React from "react";

export default function ShoppingPriceTracker({ priceTracker }) {
  const { isLoading, error, storeTotals } = priceTracker || {};
  const stores = Array.isArray(storeTotals) ? storeTotals : [];
  const prices = stores.map((store) => store.total);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0.1;
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
          {isLoading ? (
            <div className='px-4 py-6 border-b-4 border-black bg-white'>
              <p className='text-sm font-bold uppercase tracking-wide text-black'>
                Loading price tracker...
              </p>
            </div>
          ) : error ? (
            <div className='px-4 py-6 border-b-4 border-black bg-white'>
              <p className='text-sm font-bold uppercase tracking-wide text-black'>
                Price tracker unavailable right now.
              </p>
              <p className='text-xs text-slate-600 mt-2 font-bold'>
                Try again in a moment.
              </p>
            </div>
          ) : stores.length === 0 ? (
            <div className='px-4 py-6 border-b-4 border-black bg-white'>
              <p className='text-sm font-bold uppercase tracking-wide text-black'>
                No price data yet.
              </p>
            </div>
          ) : (
            stores.map((store, index) => {
              const rank = index + 1;
              const score = (store.total / spread) * 100;

              return (
                <div
                  key={store.name}
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
                        {store.total.toFixed(2)}€
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
