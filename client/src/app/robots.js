export default function robots() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/auth/callback', '/api/payment/'],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
