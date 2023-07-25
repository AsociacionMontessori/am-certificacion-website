module.exports = {
  siteMetadata: {
    title: `Asociacion Montessori De Mexico, A.C.`,
    description: `La primera institución educativa en México en implementar el método montessori. Asociacion Montessori De Mexico, A.C. `,
    author: `@AsociacionMontessori`,
    siteUrl: `https://gatsbystarterdefaultsource.gatsbyjs.io/`,
  },
  plugins: [
    'gatsby-plugin-postcss',
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `kalpilli`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/kalpilliDark.png`,
      },
    },
  ],
}
