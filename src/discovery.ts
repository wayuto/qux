import { browse } from "dns_sd/src/dns_sd/browse.ts";
import { advertise } from "dns_sd/src/dns_sd/advertise.ts";
import { MulticastInterface } from "dns_sd/src/mdns/multicast_interface.ts";
import { DriverDeno } from "dns_sd/mod.deno.ts";

const multicastInterface = new MulticastInterface(new DriverDeno("IPv4"));

export const advertiseService = (async () => {
  console.log(
    `Advertising "Qux" on ${multicastInterface.hostname}:1145`,
  );

  await advertise({
    service: {
      name: multicastInterface.hostname,
      port: 1145,
      protocol: "tcp",
      type: "http",
      txt: {},
    },
    multicastInterface,
  });
})();

export const browseService = () => {
  const services: { name: string; host: string }[] = [];

  const browsePromise = (async () => {
    const start = Date.now();
    try {
      for await (
        const s of browse({
          multicastInterface,
          service: { type: "http", protocol: "tcp" },
        })
      ) {
        if (s.isActive) {
          services.push({ name: s.name, host: s.host });
        }
        if (Date.now() - start >= 5000) break;
      }
    } catch (e) {
      console.error("Browse error:", e);
    }
    return services;
  })();

  return Promise.race([
    browsePromise,
    new Promise<typeof services>((resolve) => {
      setTimeout(() => {
        resolve(services);
      }, 5000);
    }),
  ]);
};
