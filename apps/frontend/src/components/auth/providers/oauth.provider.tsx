'use client';

import { useCallback, useEffect } from 'react';
import SafeImage from '@gitroom/react/helpers/safe.image';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
// Set on logout (localStorage, so every tab sees it) so the login page doesn't bounce straight back into SSO.
export const NO_AUTO_SSO_KEY = 'noAutoSso';
const LAST_AUTO_SSO_KEY = 'lastAutoSso';

const shouldAutoSso = () => {
  try {
    const { pathname, search } = window.location;
    // Any query (error, invite org, OAuth callback code, ?local=1) means a normal page.
    if (search || !/^\/auth(\/login)?\/?$/.test(pathname)) {
      return false;
    }
    if (localStorage.getItem(NO_AUTO_SSO_KEY)) {
      return false;
    }
    // Loop guard: at most one automatic attempt per 30s.
    const last = Number(sessionStorage.getItem(LAST_AUTO_SSO_KEY) || 0);
    if (Date.now() - last < 30000) {
      return false;
    }
    sessionStorage.setItem(LAST_AUTO_SSO_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
};

export const OauthProvider = () => {
  const fetch = useFetch();
  const { oauthLogoUrl, oauthDisplayName } = useVariables();
  const t = useT();
  const gotoLogin = useCallback(async () => {
    try {
      localStorage.removeItem(NO_AUTO_SSO_KEY);
    } catch {}
    try {
      const response = await fetch('/auth/oauth/GENERIC');
      if (!response.ok) {
        throw new Error(
          `Login link request failed with status ${response.status}`
        );
      }
      const link = await response.text();
      window.location.href = link;
    } catch (error) {
      console.error('Failed to get generic oauth login link:', error);
    }
  }, []);
  useEffect(() => {
    if (shouldAutoSso()) {
      gotoLogin();
    }
  }, []);
  return (
    <div
      onClick={gotoLogin}
      className={`cursor-pointer w-full bg-btnPrimary h-[52px] rounded-[10px] flex justify-center items-center text-white font-[600] gap-[10px]`}
    >
      <div className="bg-white rounded-full p-[4px] flex">
        <SafeImage
          src={oauthLogoUrl || '/icons/generic-oauth.svg'}
          alt="genericOauth"
          width={24}
          height={24}
        />
      </div>
      <div>
        {t('sign_in_with', 'Sign in with')}&nbsp;
        {oauthDisplayName || 'OAuth'}
      </div>
    </div>
  );
};
