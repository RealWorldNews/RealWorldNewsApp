import classes from './video.module.css'

interface VideoProps {
  media: string
  poster?: string
}

export default function Video({ media, poster }: VideoProps) {
  return (
    <video
      className={classes.video}
      controls
      preload="metadata"
      playsInline
      poster={poster}
    >
      <source src={media} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
