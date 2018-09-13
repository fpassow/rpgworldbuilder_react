(function() {

//readmore
//Add class "readmore-context" to an element surrounding all readmore/readless
//   content which should be hidden and revealed together.
//Add class "readmore" to a link tag which the user clicks to display more content, and which
//   will hide the "readmore" link itself.
//Add class "readmore" to every element which will be revealed when
//    the user clicks the readmore link. This works on a span within paragraph, or on complete
//    paragraphs, lists, etc. NOTE: ALL ELEMENTS EXCEPT SPAN ARE ASSUMED TO BE DISPLAY:BLOCK.
//All readmore text is initially hidden.
//Add class "readless" to a link which the user clicks to hide all the readmore content. This
//    link is initially hidden. It is displayed and rehidden along with the rest of the readmore
//    content.



//readmore event handler
function readMore(event) {
	event.preventDefault();
    var readmoreContext = _walkUpToReadmoreContext(event.target);
    if (!readmoreContext) {
    	console.log('readmore class used without an enclosing readmore-context')
    	return;
    }
    //Change visibility of all descendants with class .readmore
    var readmores = readmoreContext.querySelectorAll('.readmore');
    for (var i = 0; i < readmores.length; i++) {
    	//Hide the readmore link
        switch (readmores[i].tagName) {
            case 'A':
        	    readmores[i].style.display = 'none';
        	    break;
        	case 'SPAN':
        	    readmores[i].style.display = 'inline';
        	    break;
        	default:
        	    readmores[i].style.display = 'block';
        }
    }
    //Display the .readless link(s)
    var readlesses = readmoreContext.querySelectorAll('a.readless');
    for (var i = 0; i < readlesses.length; i++) {
        readlesses[i].style.display = 'inline';
    }
}

function _walkUpToReadmoreContext(element) {
	var readmoreContext = element;
    while (readmoreContext && !readmoreContext.classList.contains('readmore-context'))  {
    	readmoreContext = readmoreContext.parentElement;
    }
    return readmoreContext;
}


//readless event handler
function readLess(event) {
	event.preventDefault();
    var readmoreContext = _walkUpToReadmoreContext(event.target);
    if (!readmoreContext) {
    	console.log('readless class used without an enclosing readmore-context')
    	return;
    }
    //Change visibility of all descendants with class .readmore
    var readmores = readmoreContext.querySelectorAll('.readmore');
    for (var i = 0; i < readmores.length; i++) {
    	//Hide the readmore link
        switch (readmores[i].tagName) {
            case 'A':
        	    readmores[i].style.display = 'inline';
        	    break;
        	case 'SPAN':
        	    readmores[i].style.display = 'none';
        	    break;
        	default:
        	    readmores[i].style.display = 'none';
        }
    }
    //Hide the .readless link(s)
    var readlesses = readmoreContext.querySelectorAll('a.readless');
    for (var i = 0; i < readlesses.length; i++) {
        readlesses[i].style.display = 'none';
    }
}

//Hide all the readmore content
var readmoreAll = document.querySelectorAll('.readmore');
for (var i = 0; i < readmoreAll.length; i++) {
	if (readmoreAll.tagName != 'A') {
		readmoreAll[i].style.display = 'none';
	}
}

//Set all the readMore(e) event handlers
var readmoreLinks = document.querySelectorAll('a.readmore');
for (var i = 0; i < readmoreLinks.length; i++) {
	readmoreLinks[i].onclick = readMore;
	readmoreLinks[i].style.display = 'inline';
}

//Set all the readLess(e) event handlers and hide the readless links
var readlessLinks = document.querySelectorAll('a.readless');
for (var i = 0; i < readlessLinks.length; i++) {
	readlessLinks[i].onclick = readLess;
	readlessLinks[i].style.display = 'none';
}

})();

