import { http, createConfig } from "wagmi";
import { arbitrumSepolia, baseSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, baseSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [arbitrumSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});
