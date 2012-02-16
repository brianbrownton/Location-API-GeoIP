var PREDICT_LOCATION = (function($){
	"use strict";
	
	// Add indexOf method to arrays, mainly for IE
    if( !Array.indexOf ){
        Array.prototype.indexOf = function(obj) {
			var i,
				len = this.length;
            for (i=0; i<len; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        }
    }
	
	var obj = {}, //our return object, "public" access
		textad_geo, //going to store or json geo response
		buildLink = function(type)
		{
			//set these 2 as variables because referencing the DOM is costly (performance) in JS
			var docdom = document.domain,
				lh = location.href,
				lhn = location.hostname;
			
			if(lhn == "localhost" || lhn.substring(0, 3) == "192" || lhn.substring(0, 3) == "127")
			{
				//sanitize url (incase index.php was included) to find local_helper properly
				var newLoc = lh + 'local_helper.php',
					loc = lh.lastIndexOf("/");
				if( (loc-1) != lh.length)
				{
					newLoc = lh.substring( 0, (loc+1) ) + 'local_helper.php';
				}
				return newLoc;
			}
			
			if( type == 'location' ) return "http://" + docdom + "/ext_api/get_location.php";
		},
		bl = (parent.buildLink || buildLink), //if buildlink is global, prefer it
		dating = {}, //stores our matched geo/datingDB locations
		//when we can do legitimate JSONP, regions should be migrated externally
		regions = {
			"on" : "ca08", //ontario
			"az" : "us04", //arizona
			"ca" : "us06", //california
			"dc" : "us11", //district of columbia
			"fl" : "us12", //florida
			"ga" : "us13", //georgia
			"il" : "us17", //illinois
			"in" : "us18", //indiana
			"ma" : "us25", //massachusetts
			"mb" : "ca03", //manitoba
			"mi" : "us26", //michigan
			"mo" : "us29", //missouri 
			"nc" : "us37", //north carolina
			"ny" : "us36", //new york
			"ok" : "us40", //oklahoma
			"ab" : "ca01", //alberta
			"bc" : "ca02", //british columbia
			"co" : "us08", //colorado
			"ky" : "us21", //kentucky
			"md" : "us24", //maryland
			"mn" : "us27", //minnesota
			"nm" : "us35", //new mexico
			"nv" : "ca07", //nova scotia
			"oh" : "us39", //ohio
			"qc" : "ca10", //quebec
			"nj" : "us34", //new jersey
			"tx" : "us48", //texas
			"ks" : "us20", //kansas
			"pa" : "us42", //pennsylvania
			"wa" : "us53", //washington
			"va" : "us51" //virginia
		}
	
	obj.init = function(json){
		textad_geo = json;
		
		//use either city_region or region_name
		textad_geo.region_name = (textad_geo.region_name || textad_geo.city_region);
		
		//convert everything to lowercase for easy matching
		textad_geo.country_code = textad_geo.country_code.toLowerCase();
		textad_geo.country_name = textad_geo.country_name.toLowerCase();
		textad_geo.region_name = textad_geo.region_name.toLowerCase();
		textad_geo.city = textad_geo.city.toLowerCase();
		
		PREDICT_LOCATION.datingLocation();
	}
	
	obj.datingLocation = function(){

		var dataObj = {};
		
		dataObj.actionname = 'location';
		dataObj.sel_locCountry = (dating.country || '');
		dataObj.sel_locState = (dating.region || '');
		
		$.ajax({
			url: bl('location'),
			type: "POST",
			data: dataObj,
			dataType: "xml",
			success: PREDICT_LOCATION.parseLocation,
			error: function( reqObj, textStatus, errorThrown )
			{
				alert('location error: '+textStatus+ ' : ' + errorThrown);
			}
		});
	}
	
	obj.parseLocation = function(xml){
		var ind = -1,
			selector = xml.getElementsByTagName("list")[0].getAttribute("name"),
			list = [],
			val = [],
			opt = xml.getElementsByTagName("option"),
			i,
			len = opt.length;
		
		//throw xml options into string array
		for(i=0; i<len; i++){
			list.push(opt[i].childNodes[0].nodeValue.toLowerCase());
		}
		
		if(selector==="sel_locCountry"){
			ind = list.indexOf(textad_geo.country_name);
			if(ind !== -1){
				console.log('country set - '+ind+' : '+list[ind]+'['+opt[ind].getAttribute("value")+']');
				dating.country = opt[ind].getAttribute("value");
			}
			else{
				//fallback, try matching based on country code
				list = [];
				for(i=0; i<len; i++){
					list.push(opt[i].getAttribute("value").toLowerCase());
				}
				
				ind = list.indexOf(textad_geo.country_code);
				if(ind !== -1){
					console.log('country set - '+ind+' : '+list[ind]+'['+textad_geo.country_code+'] (fallback)');
					dating.country = list[ind];
				}
				else{
					console.log('country not found in dating DB: '+textad_geo.country_name+"["+textad_geo.country_code+"]");
					return;  //couldn't find country, don't try region
				}
			}
			
			//mark the match as selected and make the list public
			$(opt[ind]).attr("selected", "selected");
			obj.sel_locCountry = opt;
			
			PREDICT_LOCATION.datingLocation();
			return;
		}
		
		
		if(selector==="sel_locState"){
			/*we use an interface, the region object, to translate geo IP values into our database values*/
			var prop,
				interface_ind = -1,
				interface_list = [];
			for(prop in regions){
				interface_list.push(prop);
				val.push(regions[prop]);
			}
			
			interface_ind = interface_list.indexOf(textad_geo.region_name);
			if(interface_ind !== -1){
				dating.region = val[interface_ind];
				
				//now find it in the xml list
				list = [];
				for(i=0; i<len; i++){
					list.push(opt[i].getAttribute("value").toLowerCase());
				}
				
				ind = list.indexOf(dating.region);
				console.log('region set - '+ind+' : '+interface_list[interface_ind] + '['+val[interface_ind]+']');
			}
			else{
				console.log('region not found in interface to dating DB: '+textad_geo.region_name);
				return;  //couldn't find region, don't try city
			}
			
			//mark the match as selected and make the list public
			$(opt[ind]).attr("selected", "selected");
			obj.sel_locState = opt;
			
			PREDICT_LOCATION.datingLocation();
			return;
		}
		
		
		if(selector==="sel_locCity"){
			var cityFound = false,
			
			//search normally
			ind = list.indexOf(textad_geo.city);
			if(ind !== -1){
				cityFound = true;
				console.log('city set - '+ind+' : '+list[ind] + '['+opt[ind].getAttribute("value")+']');
				dating.city = opt[ind].getAttribute("value");
			}
			else{
				//fallback, try without spaces in city name
				var new_city = textad_geo.city.replace(/\s+/gi,""),
					new_ind = list.indexOf(new_city);
				
				if(new_ind !== -1){
					cityFound = true;
					console.log('city set - '+new_ind+' : '+list[new_ind] + '['+val[new_ind]+'] (fallback)');
					dating.city = val[new_ind];
				}
			}
			if(!cityFound){
				console.log('city not found in dating DB: '+textad_geo.city);
				return; //couldn't find city
			}
			
			//mark the match as selected and make the list public
			$(opt[ind]).attr("selected", "selected");
			obj.sel_locCity = opt;
		}
		
		return;
	}

	
	return obj;
}(jQuery));