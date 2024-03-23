import classes from './video.module.css'
interface VideoProps {
  media: string;
}

export default function Video({media} : VideoProps) {
  return (
    <video  className={classes.video} width="320" height="240" controls preload="none">
      <source src={media} type="video/mp4" />
      <track
        src={media}
        kind="subtitles"
        srcLang="en"
        label="English"
      />
      Your browser does not support the video tag.
    </video>
      );
    }