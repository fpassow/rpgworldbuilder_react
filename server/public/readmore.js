(function() {

/* 
Provides "read more" and "read less" functionality for a web page.

The user sees a link which says "...read more" at the end of a section of text. 
When they click it, they see more content, and a link that says "read less".
And clicking "read less" hides the extra content again.


To use, mark some HTML element which contains all the relevant parts with the 
class "readmore-context".

Within the readmore-context element, incude tags like:
<a href="#" class="readmore">... read more</a>
<a href="#" class="readless"> read less</a>

You can change the text "...read more" and "read less" to be anything you want.

Then mark other elements inside the readmore-context element with the class "readmore".
These elements will be initially hidden. They will appear when the user clicks the "readmore"
link and be hidden again when the user clicks the "readlist" link.

You can mark many kinds of elements, including span, ul, ol, div, p, table, etc.
However, all elements except span will be revealed using display:block. So if an
element should be display:inline, wrap it in a span and put the "readmore" class on the span.

NOTE: Do not put your "readmore" link inside of an element which will be hidden.

Example:

<div class="readmore-Context">

<p>This text is always displayed but<a href="#" class="readmore">... read more</a>
<span class="readmore"> this text is only displayed when the user clicks the reamore
link.</span></p>

<p class="readmore">And this paragraph is only displayed after the user clicks the
readmore link.</p>

<a href="#">readless</a>

</div>

*/



//readmore event handler
function readMore(event) {
	event.preventDefault();
    var readmoreContext = _walkUpToReadmoreContext(event.target);
    if (!readmoreContext) {
    	console.log('Error: readmore class used without an enclosing readmore-context')
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

//Check parent elements until we find one with class readmore-context
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
    	console.log('Error: readless class used without an enclosing readmore-context')
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

