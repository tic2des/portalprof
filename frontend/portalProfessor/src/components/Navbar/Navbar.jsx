import styles from './Navbar.module.css'
import Link from '../Link/Link'
import Button from '../Button/Button'

function Navbar(props)
{
    if(props.isLogged == "true"){
        return(
            <nav>

                <h3 className={styles.portalProfessor}>Portal do Professor</h3>
                    
                <ul>
                    
                    <li>
                        <Link href="#" value="Apresentação Plus"/>
                    </li>
                    <li>
                        <Link href="#" value="FormQParser"/>
                    </li>
                    <li>
                        <Link href="#" value="Tic2Des"/>
                    </li>
                    
                </ul>
            </nav>
        )
    }else if(props.isLogged == "false"){
        return(
        <nav>
            <div className={styles.notLogged}>
                <h3 className={styles.portalProfessor}>Portal do Professor</h3>
                
                <Button value="Entre com Google"/>
            </div>
        </nav>
        )
    }
}

export default Navbar