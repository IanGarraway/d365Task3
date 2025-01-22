this.OnContactChange = function (executionContext) {
    var formContext = executionContext.getFormContext();
    

    //getting the quickview
    var quickViewControl = formContext.ui.quickForms.get("primaryContactQuickView");
    var contactProperty = formContext.getAttribute("primarycontactid").getValue();
    if (quickViewControl&&contactProperty!==null) {
        quickViewLoadCheck(quickViewControl);
        
    } 

}

this.quickViewLoadCheck = function (quickViewControl, count = 0) {
    if (quickViewControl.isLoaded()) {
        modifyQuickView(quickViewControl);
            
    } else {
        if (count === 10) {
            formContext.ui.setFormNotification("QuickViewControl didn't load", "ERROR", "QuickViewLoadError");
        }
        else {
            let myTimeout = setTimeout(() => this.quickViewLoadCheck(quickViewControl, ++count), 100);
        }
        
    }
    
}

this.modifyQuickView = function (quickViewControl) {
    var emailValue = quickViewControl.getAttribute("emailaddress1").getValue();
            var emailControl = quickViewControl.getControl("emailaddress1");
            var phoneValue = quickViewControl.getAttribute("mobilephone").getValue();
            var phoneControl = quickViewControl.getControl("mobilephone")

            hideIfNull(emailValue, emailControl);
            hideIfNull(phoneValue, phoneControl);
            quickViewControl.refresh();
}

this.hideIfNull = function (value, control ) {
    
    if (value === null) {
        control.setVisible(false);
        
    } else {
        control.setVisible(true);
        
    }

}