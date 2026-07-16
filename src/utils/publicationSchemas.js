const buildPublicationSchemas = ({
  posts = [],
  books = [],
  pageUrl,
  language,
}) => {
  const listNames =
    language === "pt-BR"
      ? { articles: "Artigos recentes", books: "Livros AMMAC" }
      : language === "en"
        ? { articles: "Recent articles", books: "AMMAC books" }
        : { articles: "Artículos recientes", books: "Libros AMMAC" }

  const articleList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#articles`,
    name: listNames.articles,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: post.url,
    })),
  }
  const bookList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#books`,
    name: listNames.books,
    itemListElement: books.map((book, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: book.title,
      url: book.amazonUrl,
    })),
  }
  const bookSchemas = books.map(book => ({
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${pageUrl}#${book.id}`,
    name: book.title,
    description: book.description,
    image: new URL(book.coverImage, pageUrl).toString(),
    inLanguage: "es",
    author: {
      "@id": "https://certificacionmontessori.com/roxana/#person",
    },
    publisher: {
      "@id": "https://certificacionmontessori.com/#organization",
    },
    url: book.amazonUrl,
  }))

  return [articleList, bookList, ...bookSchemas]
}

module.exports = { buildPublicationSchemas }
