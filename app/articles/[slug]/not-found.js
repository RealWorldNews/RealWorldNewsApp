import Link from 'next/link'
 
export default function ArticleNotFound() {
  return (
    <div className='not-found'>
      <h2>Article not found</h2>
      <p>this Article was not found ...</p>
      <Link href="/">go back to Articles</Link>
    </div>
  )
}