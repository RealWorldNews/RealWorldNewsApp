'use client'
import classes from './page.module.css'
import Link from 'next/link'
import MailToButton from '@/components/ui/mail-to-button'
export default function ResourcesPage() {
    return (
        <div className={classes.contact}>
        <div>
          <hr />
          <h2>Write distort new RWNews @:</h2>
          <MailToButton
            label='RWNews@gmail.com'
            mailto='mailto:contact@distortnewyork.com'
          />
          <div>
            <br/>
          click{' '}
          <Link
            href="https://donate.stripe.com/5kA7wegxI9Bme4g289"
            target='_blank'
            rel='noopener noreferrer'
          > here 🖤 </Link>{' '} to donate
          </div>
          <hr />
        </div>
        <div>
          <h2>Mayday Space</h2>
          <p>
            A HOME FOR MOVEMENTS, SOCIAL JUSTICE ACTIVISM, AND COMMUNITY EVENTS
          </p>
          <Link
            href='https://maydayspace.org/'
            target='_blank'
            rel='noopener noreferrer'
          >
            https://maydayspace.org/
          </Link>
          <hr />
        </div>
        <div>
          <h2>Save Project Reach</h2>
          <p>
            Raising funds to help empower young people and marginalized
            communities.
          </p>
          <Link
            href='https://www.instagram.com/saveprojectreach/'
            target='_blank'
            rel='noopener noreferrer'
          >
            @saveprojectreach
          </Link>
          <hr />
        </div>
        <div>
          <h2>The Atlanta Solidarity Fund</h2>
          <p>
            The Atlanta Solidarity Fund bails out activists who are arrested for
            participating in social justice movements, and helps them get access
            to lawyers.
          </p>
          <p>
            Your contribution will go directly to supporting those facing
            repression. Please contribute what you can.
          </p>
          <p>When we stand together, we are strong!</p>
          <Link
            href='https://actionnetwork.org/fundraising/contribute-to-the-atlanta-solidarity-fund'
            target='_blank'
            rel='noopener noreferrer'
          >
            contribute to the atlanta solidarity fund
          </Link>
          <hr />
        </div>
      </div>
    )
}