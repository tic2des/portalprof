import { NavLink } from "react-router"

function Link(props){
    return <NavLink to={props.href}>{props.value}</NavLink>
}

export default Link