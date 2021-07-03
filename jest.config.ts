import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!(mangadex-client)/)"],
};

export default config;
