import { addRouteMiddleware, defineNuxtPlugin, navigateTo } from "#imports";
import { useRequestURL, useRuntimeConfig } from "nuxt/app";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const { hostname } = requestUrl;

  const customDomains = (config.public.customDomains || {}) as Record<string, string>;
  const customDomain = customDomains[hostname];

  if (customDomain) {
    return {
      provide: {
        tenant: customDomain
      }
    };
  }

  const rootDomains = (config.public.rootDomains || []) as string[];
  const rootDomain = rootDomains.find((domain) => hostname.endsWith(domain));
  const subDomainAliases = (config.public.subDomainAliases || {}) as Record<string, string>;

  if (!rootDomain) {
    return {
      provide: {
        tenant: "",
      },
    };
  }
  let subdomain;
  if (config.public.strictSubdomains) {
    subdomain = hostname.substring(0, hostname.indexOf(rootDomain) - 1);
  } else {
    subdomain = hostname.split(".")[0];
  }
  const tenant = subDomainAliases[subdomain] || subdomain;
  const hasAliasRedirect = subdomain !== tenant;

  if (hasAliasRedirect) {
    addRouteMiddleware(
      "multi-tenancy-subdomain-alias",
      (to) => {
        const protocol = import.meta.client ? window.location.protocol : requestUrl.protocol;
        return navigateTo(`${protocol}//${tenant}.${rootDomain}${to.fullPath}`, {
          external: true,
          redirectCode: 301,
        });
      },
      { global: true },
    );
  }

  return {
    provide: {
      tenant,
    },
  };
});
