/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["pdf-parse", "llamaindex"],
    },
};

module.exports = nextConfig;