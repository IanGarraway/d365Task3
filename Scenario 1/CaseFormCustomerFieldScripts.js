//This method to be called when the Customer field is changed
//It controls retrieving the contact data for the accounts
//Primary contact and then set's the contact field to that value.
this.SetContactOnCustomerChange = async function (executionContext) {
    //Get form context
    var formContext = executionContext.getFormContext();

    //Get customerField type
    var customerField = formContext.getAttribute("customerid");    

    //check to ensure data in field
    if (customerField && customerField.getValue() !== null) {        
        //get the lookup value
        var customer = customerField.getValue()[0];

        //checking entity type
        if (customer.entityType === "account") {
            // Retrieve the primary contact from the account and set it
            try {
                const primaryContact = await getContactFromAccount(customer.id);
                if (primaryContact) {                    
                    setContact(formContext, primaryContact);
                }
            } catch (error) {
                formContext.ui.setFormNotification(
                    "Error retrieving primary contact: " + error.message,
                    "ERROR",
                    "ERPCMessage"
                );
            }            
        }         
    }    
}

//This method sets the contact field to the primary contact of the account if available
this.setContact = function (formContext, contactToSet) {    
    var contactField = formContext.getAttribute("primarycontactid");

    if (contactField.getValue() === null) {//check to ensure that the field is blank, to stop existing data being overridden. 
        contactField.setValue([
            {
                id: contactToSet.id,
                name: contactToSet.name,
                entityType: "contact",
            },
        ]);        
        contactField.fireOnChange(); //Triggers the contacts event to ensure the fields display correctly
    } 
}

//this methods retrieves the primary contact of an account
this.getContactFromAccount = async function (accountId) {
    return new Promise(function (resolve, reject) {
        // This line uses the XRM toolset to query the account table for the primary contact
        Xrm.WebApi.retrieveRecord(
            "account",
            accountId,
            "?$select=primarycontactid&$expand=primarycontactid($select=fullname)"
        ).then(
            function success(result) { //if it was sucessful in retrieving the contact it then stores and returns them in an object 
                if (result.primarycontactid) {                    
                    resolve({
                        id: result.primarycontactid.contactid,
                        name: result.primarycontactid.fullname,
                    });
                } else {                    
                    resolve(null); // No primary contact associated and so returns a null object
                }
            },
            function error(error) { //Error handling
                console.log("Error occurred" + error);
                reject(error);
            }
        );
    });
};


