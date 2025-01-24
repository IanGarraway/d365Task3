//This function is called by the event, and pulls the data from the context
//ensures the data is available before calling the quickview load checker.
this.OnContactChange = function (executionContext) {
    const formContext = executionContext.getFormContext();    

    //getting the quickview
    const quickViewControl = formContext.ui.quickForms.get("primaryContactQuickView");
    const contactProperty = formContext.getAttribute("primarycontactid").getValue();
    if (quickViewControl&&contactProperty) {
        quickViewLoadCheck(quickViewControl);        
    } 
}

//This method is there to ensure that the QuickViewControl has loaded before any changes are made to it.
//It will check if the control has loaded, if it hasn't, it will check to see if it has tried 10 times, 
//If it hasn't it will wait .1 of a second before calling itself to try again.
this.quickViewLoadCheck = function (quickViewControl, count = 0) {
    if (quickViewControl.isLoaded()) {
        modifyQuickView(quickViewControl);            
    } else {
        if (count === 10) {
            formContext.ui.setFormNotification("Primary Contact Details didn't load", "ERROR", "QuickViewLoadError");
        }
        else {
            setTimeout(() => this.quickViewLoadCheck(quickViewControl, ++count), 100); 
        }        
    }    
}

//This method acquires the values and controls for the email and phone components on the quickview control
//It will then pass them to the method which checks if they are null. 
this.modifyQuickView = function (quickViewControl) {
    const emailValue = quickViewControl.getAttribute("emailaddress1").getValue();
    const emailControl = quickViewControl.getControl("emailaddress1");
    const phoneValue = quickViewControl.getAttribute("mobilephone").getValue();
    const phoneControl = quickViewControl.getControl("mobilephone");

    hideIfNull(emailValue, emailControl);
    hideIfNull(phoneValue, phoneControl);
    quickViewControl.refresh();
}

//This method checks to see if the components value is null and if it is sets it to not visible
//or if the value is not null sets the componet to visible.
this.hideIfNull = function (value, control ) {    
    if (value === null) {
        control.setVisible(false);        
    } else {
        control.setVisible(true);        
    }
}