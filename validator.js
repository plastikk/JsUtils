/**
 * http://www.jcs.no/Validator.js
 * 
 * Real simple form validator for JavaScript
 * © 2011 Joakim Staalstrøm ( joakim(at)diskodata.com ) 
 * 
 * Requires jQuery - Developed for v1.6.1
 */

/**
 * Validator constructor
 * 
 * @param object   form      The form as a jQuery object. Submit event will automatically trigger Validator validation.
 * @param object   rules     Object with form element names as keys, and rule objects as values. Options: rules, callback, preventFurtherCallbacks.
 * @param function onInvalid General callback function when invalid. Is passed error text as string
 * @param function onSubmit  General callback function for submit. Overrides submit(). For use with ajax forms.
 * @param bool     debug     Whether or not debug messages should be logged in console
 */

function Validator(form, rules, /* optional */ onInvalid, onSubmit, debug) {
	
	// Handle optional arguments
	this.onInvalid = onInvalid || null;
	this.onSubmit = onSubmit || null;
	this.debug = debug || false;
	
	// Reference to this instance
	var thisInstance = this;
	
	// Store the form elements in this new Validator object
	// Store form jQuery object
	this.form = form;
	
	// Value for storing last error message
	this.errorMsg = "";
	
	// Create (code friendly) arrays with jQuery objects of all form elements
	this.formElements = [];
	this.origValues   = [];
	this.ruleObjects  = [];
	this.paramObjects = [];
	
	var i = 0;
	for (var rule in rules) {
		this.formElements[i] = this.form.find('[name="' + rule + '"]');
		this.origValues[i]   = this.formElements[i].val();
		this.ruleObjects[i]  = rules[rule];
		
		if (this.formElements[i].length != 0) {
			if (this.debug && window.console) console.log("Validator: Registered element " + this.formElements[i].attr('name'));
			
			// Set up selection event handlers
			// If original value, select all text
			this.formElements[i].attr("validatorid", i); // Store validator id for later
			this.formElements[i].click(function() {
				var valID = $(this).attr("validatorid");
				if ($(this).val() == thisInstance.origValues[valID]) {
					this.select();
				}
			});
			
			// If no text inserted, restore original value
			this.formElements[i].blur(function() {
				var valID = $(this).attr("validatorid");
				if ($(this).val() == "") {
					$(this).val(thisInstance.origValues[valID]);
				}
			});
		}
		else {
			if (this.debug && window.console) console.log("Validator: Invalid element name in rules object: " + rule)
			return false;
		}
		i++;
	}
	
	// Set up submit handler
	var currentValidator = this;
	this.form.submit(function() {
		currentValidator._validate();
		return false;
	});
		
	if (this.debug && window.console) console.log("Validator: Validation set up!");
	//this.formElements = formElements;
}

//
// Validator instance public methods

/**
 * clear()
 * Clears classes added by Validator
 */

Validator.prototype.clear = function() {
	for (var i = 0, elementAmount = this.formElements.length; i < elementAmount; i++ ) {
		this.formElements[i].removeClass("invalid");
	}
	this.errorMsg = "";
}

//
// Validator instance private methods

Validator.prototype._validate = function() {
	if (this.debug && window.console) console.log("Validator: Validation triggered");
	
	// Clear invalid
	this.clear();
	
	// Assume the best
	var allOK = true;
	var currentFieldOK = true;
	var preventFurtherCallbacks = false;
	var required;
	var pattern;
	
	// Iterate through fields
	for (var i = 0, elementAmount = this.formElements.length; i < elementAmount; i++ ) {
		
		// Per field variables
		required = true;
		currentFieldOK = true;
		
		if (this.debug && window.console) console.log("Validator: Checking " + this.formElements[i].attr('name') + " with value " + this.formElements[i].val());
				
		// Additional validation
		if (this.ruleObjects[i].rules) {
			if (this.debug && window.console) console.log("Validator: There are custom rules for " +  this.formElements[i].attr('name'));
			
			// TODO: More elegant array iteration
			for (var ii = 0; ii < this.ruleObjects[i].rules.length; ii++) {
				switch (this.ruleObjects[i].rules[ii]) {
					case "optional" :
						required = false;
						break;
					case "email" :
						if (this.debug && window.console) console.log("Validator: Checking email pattern");
						pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)?([\.]{1}[a-zA-Z]{2,4}){1,4}$/;  
						if (!pattern.test(this.formElements[i].val())) {
							this.errorMsg = (this.errorMsg != "") ? this.errorMsg : "Vennligst fyll ut en gyldig epost-adresse";
							allOK = currentFieldOK = false;
						}
						break;
					case "regex" :
						if(this.debug && window.console) console.log("Validator: Checking regex");
						pattern = new RegExp(this.ruleObjects[i].params[ii]);
						if(!pattern.test(this.formElements[i].val())) {
							this.errorMsg = (this.errorMsg != "") ? this.errorMsg : "Please supply a proper value.";
							allOK = currentFieldOK = false;
						}
						break;
				}
				// If one rule invalidates, don't bother checking the rest
				if (!currentFieldOK) {
					break;
				}
			}
		}
		
		// Default validation
		if (required) {
			// alert ("Validating " + this.formElements[i].attr("name") + "with value " + this.formElements[i].val());
			if (this.formElements[i].val() == this.origValues[i] || this.formElements[i].val() == '') {
				// alert (this.formElements[i].attr("name") + "'s value is " + this.formElements[i].val() + ": not valid!" );
				this.errorMsg = (this.errorMsg != "") ? this.errorMsg : "Vennligst fyll ut følgende felt: " + this.formElements[i].attr('name');
				allOK = currentFieldOK = false;
				if (this.debug && window.console) console.log("Validator: " +  this.formElements[i].attr('name') + " not valid!" );
				// break;
			}
		}
		
		// If the current field isn't OK, and further callbacks hasn't been stopped ...
		if (!currentFieldOK && !preventFurtherCallbacks) {
			
			// Call back if callback set
			if (this.ruleObjects[i].callback) {
				this.ruleObjects[i].callback(this.errorMsg);
			}
			
			// Set flag if further callbacks should be stopped 
			if (!this.ruleObjects[i].preventFurtherCallbacks) { // TODO: Implement stopOtherCallbacks parameter
				preventFurtherCallbacks = true;
			}
		}
		
		// Add invalid class if not valid
		if (!currentFieldOK) {
			this.formElements[i].addClass("invalid");
		}
	}
	
	// Run general callback if needed
	if (!allOK && this.onInvalid) {
		this.onInvalid();
	}
	
	// If all ok, submit form!
	if (allOK) {
		if(!this.onSubmit) {
			this.form.unbind(); // Unbind submit handlers
			this.form.submit();
		} else {
			this.onSubmit();
		}
	}
	
	return false;
}

// vim: noet ts=2 sw=2
