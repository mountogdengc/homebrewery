import './navbar.less';
import React from 'react';
import createReactClass from 'create-react-class';

import Nav from './nav.jsx';

const Navbar = createReactClass({
	displayName : 'Navbar',

	render : function(){
		return <Nav.base>
			<Nav.logo />
			{this.props.children}
		</Nav.base>;
	}
});

export default Navbar;
