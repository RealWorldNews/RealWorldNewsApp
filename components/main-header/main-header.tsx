import classes from './main-header.module.css'
import NavLink from './nav-link'

export default function MainHeader() {
  return (
    <header className={classes.header}>
      <NavLink href="/">
        <span className={classes.logoImage} role="img" aria-label="Real World News" />
      </NavLink>

      <nav className={classes.nav}>
        <ul>
          <li>
            <NavLink href="/resources">resources</NavLink>
          </li>
          <li>
            {/* <NavLink href='/trips/share'>share</NavLink> */}
          </li>
        </ul>
      </nav>
    </header>
  )
}
