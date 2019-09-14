/**
 * AgreementStruk Transaction
 * @param {org.malatest.datclic.AgreementStruck} agreementData
 * @transaction
 * 
 * 1. Check for the validity of the Strike Date - throw error 
 * 2. Create the LicenseAgreement asset
 *    2.1 Set the LicenseAgreementID
 *    2.2 Create an instance of the 'Licensor' Relationship, set its data
 *    2.3 Create an instance of the 'Licensee' Relationship, set its data
 *    2.4 Set the LicenseAgreement asset FirstParty = created 'Licensor' Relationship
 *    2.5 Set the LicenseAgreement asset SecondParty = created 'Licensee' Relationship
 *    2.6 set the 'Category' of the license.
 *    2.7 set the 'DataSetName', 'LicenseHashDigest', 'ValidityPeriod', 'Cost'
 * 3. Add the LicenseAgreement asset to the registry
 **/

 function AgreementStruck(agreementData){

     // 1.Validate the strike date, If the date is a past date then error thrown

     var timeNow = new Date().getTime();
     var startTime= new Date(agreementData.StrikeDate).getTime();
     if(startTime >= timeNow){
        throw new Error("Start time cannot be in the past!!!");
     }
     var factory = getFactory();
     var NameSpace = 'org.malatest.datclic';

    // 2.1 generating the LicenseAgreementID using agreement number and strike date
    var LicenseAgreementID = generateAgreementID(agreementData.StrikeDate, agreementData.AgreementNumber);
    var newLicenseAgreement = factory.newResource(NameSpace,'LicenseAgreement',LicenseAgreementID);

    // 2.2 2.3 2.4 and 2.5
    return getParticipantRegistry(NameSpace+'.Licensor')
    .then((provider) => {
        return provider.get(agreementData.FirstPartyID);
    }).then (() => {
        var licensorRelationship = factory.newRelationship(NameSpace,'Licensor',agreementData.FirstPartyID);
        newLicenseAgreement.FirstParty = licensorRelationship;
        return getParticipantRegistry(NameSpace+'.Licensee');
    }).then((requester) => {
        return requester.get(agreementData.SecondPartyID);
    }).then (() => {
        var licenseeRelationship = factory.newRelationship(NameSpace,'Licensee',agreementData.SecondPartyID);
        newLicenseAgreement.SecondParty = licenseeRelationship;
        return getAssetRegistry('org.malatest.datclic.LicenseAgreement');
    }).then((Registry) => {         

    // 2.6 set the 'Category' of the license.
    newLicenseAgreement.Category = agreementData.Category;

    // 2.7 set the 'DataSetName', 'LicenseHashDigest', 'ValidityPeriod', 'Cost'         
    newLicenseAgreement.DataSetName = agreementData.DataSetName;
    newLicenseAgreement.LicenseHashDigest = agreementData.LicenseHashDigest;
    newLicenseAgreement.ValidityPeriod = agreementData.ValidityPeriod;
    newLicenseAgreement.Cost = agreementData.Cost;

    // 3. Add the LicenseAgreement asset to the registry 
        return Registry.add(newLicenseAgreement);
    }).catch((error) => {
        throw new Error(error);
    });
 }

 

 /**
  * AgreementInfringed Transaction
  * @param {org.malatest.datclic.AgreementInfringed} agreementInfo
  * @transaction
  * 1. Get the infringed LicenseAgreement from the asset registry, using its ID
  * 2. Revoke it by deleting it from the asset registry
 **/ 

 function AgreementInfringed(agreementInfo){

    var newInfringedAgreement;
    return getAssetRegistry('org.malatest.datclic.LicenseAgreement')
    .then((Registry) => {
        return Registry.get(agreementInfo.LicenseAgreementID);
    }).then((agreement) => {
        var factory = getFactory();
        newInfringedAgreement = factory.newResource('org.malatest.datclic','Infringements',agreement.LicenseAgreementID);
        newInfringedAgreement.Category = agreement.Category;
        newInfringedAgreement.LicenseHashDigest = agreement.LicenseHashDigest;
        newInfringedAgreement.FirstParty = agreement.FirstParty;
        newInfringedAgreement.SecondParty = agreement.SecondParty;
        newInfringedAgreement.InfringementDetails = agreementInfo.InfringementDetails;

        return getAssetRegistry('org.malatest.datclic.Infringements');
    }).then((InfringeInfo) => {
        return InfringeInfo.add(newInfringedAgreement);
    })
    .catch((error) =>{
        throw new Error(error);
    });
}


 /**
 * Creates the LicenseAgreementID from agreement number and the strike date
 **/

function generateAgreementID(StrikeOn,AgreementNum){

    var dt = new Date(StrikeOn)

    // Date & Month needs to be in the format 01 02, so add a '0' if they are single digits
    var month = dt.getMonth()+1;
    if((month+'').length == 1)  month = '0'+month;
    var dayNum = dt.getDate();
    if((dayNum+'').length == 1)  dayNum = '0'+dayNum;

    return AgreementNum+'-'+month+'-'+dayNum+'-'+(dt.getFullYear()+'').substring(2,4);
}
