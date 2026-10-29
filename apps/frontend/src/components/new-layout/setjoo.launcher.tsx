'use client';

import { FC, useEffect, useState } from 'react';
import clsx from 'clsx';
import { useClickAway } from '@uidotdev/usehooks';
// Refreshed from https://auth.setjoo.com/api/v1/applications at build time (deploy/setjoo/buildspec.yml)
import data from '@gitroom/frontend/components/new-layout/setjoo.apps.json';

const CURRENT_APP = 'social';
const GROUPS = [
  { id: 'operating', label: 'Operating' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'intelligence', label: 'Intelligence' },
];

const label = (name: string) => name.replace(/^Setjoo\s+/, '');

// Setjoo network launcher, same panel as Core's NetworkLauncher.
export const SetjooLauncher: FC = () => {
  const [show, setShow] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => setShow(false));

  useEffect(() => {
    if (!show) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShow(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show]);

  return (
    <div className="relative mobile:static" ref={ref}>
      <button
        type="button"
        className="flex items-center justify-center hover:text-newTextColor"
        aria-expanded={show}
        aria-haspopup="dialog"
        aria-label="Setjoo apps"
        onClick={() => setShow(!show)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          {[3, 10, 17].flatMap((y) =>
            [3, 10, 17].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />)
          )}
        </svg>
      </button>
      {show && (
        <div
          role="dialog"
          aria-label="Setjoo apps"
          className={clsx(
            'opacity-0 animate-normalFadeDown mt-[10px] absolute w-[352px] top-[100%] end-0 bg-newBgColorInner text-newTextColor rounded-[12px] flex flex-col border border-newTableBorder shadow-menu overflow-hidden z-[600]',
            'mobile:mt-0 mobile:w-auto mobile:start-[8px] mobile:!end-[8px]'
          )}
        >
          <div className="max-h-[min(80vh,36rem)] overflow-y-auto p-[12px]">
            <div className="px-[4px] text-[11px] font-[600] uppercase tracking-[0.16em] text-textItemBlur">
              Setjoo network
            </div>
            {GROUPS.map((group) => (
              <div key={group.id} className="mt-[12px]">
                <div className="mb-[6px] px-[4px] text-[10px] font-[600] uppercase tracking-[0.16em] text-textItemBlur">
                  {group.label}
                </div>
                <div className="grid grid-cols-3 gap-[4px]">
                  {data.applications
                    .filter((app) => app.group === group.id)
                    .map((app) => {
                      const ready = app.status === 'available';
                      return (
                        <a
                          key={app.slug}
                          href={`https://${app.publicHost}/`}
                          aria-current={app.slug === CURRENT_APP ? 'page' : undefined}
                          className={clsx(
                            'flex flex-col items-center gap-[6px] rounded-[8px] px-[8px] py-[10px] text-center hover:bg-boxHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-setjoo-red',
                            app.slug === CURRENT_APP && 'bg-boxHover ring-1 ring-newTextColor',
                            !ready && 'opacity-70'
                          )}
                          onClick={() => setShow(false)}
                        >
                          <span
                            className={clsx(
                              'flex h-[36px] w-[36px] items-center justify-center rounded-full text-[10px] font-[700]',
                              ready ? 'bg-setjoo-red text-white' : 'bg-boxHover text-textItemBlur'
                            )}
                          >
                            {label(app.name).slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-[11px] font-[500] leading-[16px]">
                            {label(app.name)}
                          </span>
                          {!ready && (
                            <span className="text-[9px] uppercase tracking-[0.12em] text-textItemBlur">
                              Coming
                            </span>
                          )}
                        </a>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-[12px] border-t border-newTableBorder px-[12px] py-[8px] text-[12px] text-textItemBlur">
            <a href="https://auth.setjoo.com/" className="hover:text-newTextColor">
              Setjoo account
            </a>
            <a href="https://business.setjoo.com/" className="hover:text-newTextColor">
              Business
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
