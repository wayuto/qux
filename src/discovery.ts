import { browse } from "dns_sd/src/dns_sd/browse.ts";
import { MulticastInterface } from "dns_sd/src/mdns/multicast_interface.ts";
import { DriverDeno } from "dns_sd/mod.deno.ts";

console.log("Browsing for local HTTP services...");

const multicastInterface = new MulticastInterface(new DriverDeno("IPv4"));

for await (
    const service of browse({
        multicastInterface,
        service: {
            protocol: "tcp",
            type: "http",
        },
    })
) {
    if (service.isActive) {
        console.log(`📡 ${service.name} - ${service.host}:${service.port}`);
    }
}