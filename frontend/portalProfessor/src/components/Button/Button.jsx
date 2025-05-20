import styles from './Button.module.css'


function Button(props)
{
    return(
        <input type="submit" value={props.value} className={styles.btn}></input>
    )
}

export default Button