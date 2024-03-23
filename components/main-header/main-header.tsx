import classes from './main-header.module.css'
import NavLink from "./nav-link";
export default function MainHeader() {

  return (
    <header className={classes.header}>
      <NavLink href='/'>
      <p><span className={classes.highlight}>Real World News</span>🌎</p>
      </NavLink>
      
      <nav className={classes.nav}>
        <ul>
          <li>
            <NavLink href='/resources'>resources</NavLink>
          </li>
          <li>
            {/* <NavLink href='/trips/share'>share</NavLink> */}
          </li>
        </ul>
      </nav>
    </header>
  );
}