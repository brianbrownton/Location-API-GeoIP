<?php
$pl = 'xxxmatch.com';

$lh = 'http://' . $_SERVER["SERVER_NAME"] . $_SERVER["REQUEST_URI"] . 'local_helper.php';
$ehh = '<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>';
$blank = '';

define('PL_NAME', $pl);
define('EXTRA_HEAD_HEADER', $ehh);
define('URL_STATIC_LOCATION', $blank);
define('URL_CUSTODIAN_OF_RECORDS', 'http://www.'. PL_NAME .'/go/custodian_of_records/');
define('URL_LOGIN', 'http://www1.'. PL_NAME .'/login/svl:home_2');
define('URL_FORGOT_PASSWORD', 'http://www.'. PL_NAME .'/go/forgotpassword/');
define('URL_FAQ', 'http://www.'. PL_NAME .'/go/faq/');
define('URL_CUSTOMER_SERVICE', 'http://www.'. PL_NAME .'/go/customer_service/');
define('URL_TERMS_AND_CONDITIONS', 'http://www.'. PL_NAME .'/go/termsandconditionsofuse/');
define('URL_PRIVACY', 'http://www.'. PL_NAME .'/go/privacypolicy/');
define('URL_SITEMAP', 'http://www.'. PL_NAME .'/go/site_map/');
define('URL_AFFILIATE', 'http://affiliate.sexsearch.com/');
define('URL_TOUR_RELAY_LOCATION_LOOKUP', $lh . '?actionname=location');
define('URL_TOUR_RELAY_ORIENTATION_LOOKUP', $lh . '?actionname=orientation');
define('URL_TOUR_RELAY_CREATE_ACCOUNT', $lh . '?actionname=account');
define('URL_TOUR_RELAY_CREATE_PROFILE', $lh . '?actionname=profile');

$ebf = '<div id="dvFooter"><ul id="ulNav" class="userNav btmCom">'.
  '<li><a id="a_faq" rel="nofollow" href="' . URL_FAQ . '"><span>FAQ</span></a></li>'.
  '<li><a id="a_forgotPassword" rel="nofollow" href="' . URL_FORGOT_PASSWORD . '"><span>FORGOT PASSWORD</span></a></li>'.
  '<li><a id="a_privacy" rel="nofollow" href="' . URL_PRIVACY . '"><span>PRIVACY</span></a></li>'.
  '<li><a id="a_termsConditions" rel="nofollow" href="' . URL_TERMS_AND_CONDITIONS . '"><span>TERMS AND CONDITIONS OF USE</span></a></li>'.
  '<li><a id="a_custodianofrecords" rel="nofollow" href="' . URL_CUSTODIAN_OF_RECORDS . '"><span>CUSTODIAN OF RECORDS</span></a></li>'.
  '<li><a id="a_affiliates" href="' . URL_AFFILIATE . '" rel="nofollow"><span>AFFILIATES</span></a></li>'.
  '<li><a id="a_sitemap" rel="nofollow" href="' . URL_SITEMAP . '"><span>SITE MAP</span></a></li>'.
'</ul></div>';
$vf = '<div id="dvFooter"><ul id="ulNav" class="userNav btmCom">'.
  '<li><a id="a_privacy" rel="nofollow" href="' . URL_PRIVACY . '"><span>PRIVACY</span></a></li>'.
  '<li><a id="a_termsConditions" rel="nofollow" href="' . URL_TERMS_AND_CONDITIONS . '"><span>TERMS AND CONDITIONS OF USE</span></a></li>'.
  '<li><a id="a_custodianofrecords" rel="nofollow" href="' . URL_CUSTODIAN_OF_RECORDS . '"><span>CUSTODIAN OF RECORDS</span></a></li>'.
'</ul></div>';

define('EXTRA_BODY_FOOTER', $ebf);
define('VANITY_FOOTER', $vf);
define('EXTRA_BODY_FOOTER_TRACKING', $blank);




class CurlConnection{
    private $cn;
    private $url;
    private $proxy;
    public function __construct($url) {
        $this -> url = $url;
	$this -> proxy = false;
    }
    public function setProxy(){
        $this -> proxy = true;
    }
    public function connect($functionality){
        header('Content-type: text/xml');
        header("Cache-Control: no-cache");
        header("Expires: -1");
        $this -> cn = curl_init($this -> url . $functionality);

        $postfields = array();
        $postfields = $_POST;

        $arr = array();
        foreach($postfields as $ind => $val)
        {
        	$ind = stripslashes($ind);
        	$val = stripslashes($val);
        	$ind = mysql_escape_string($ind);
        	$val = mysql_escape_string($val);
            $arr[] = $ind.'='.$val;

        }
        $poststring = implode('&', $arr);
        curl_setopt($this -> cn, CURLOPT_POST, true);
        curl_setopt($this -> cn, CURLOPT_POSTFIELDS, $poststring);
        curl_setopt($this -> cn, CURLOPT_RETURNTRANSFER, true);
        return $resp = curl_exec($this -> cn);
    }
	public function getGeo()
    {
    	header('Content-type: text/html');
        header("Cache-Control: no-cache");
        header("Expires: -1");
        $this -> cn = curl_init('http://textad.'. PL_NAME .'/if/1/2213/0/');
        curl_setopt($this -> cn, CURLOPT_RETURNTRANSFER, true);
        return $resp = curl_exec($this -> cn);
    }
}
if($useVD)$url = 'http://www.' . $realPL . '/ext_api/';
else $url = 'http://www.' . PL_NAME . '/ext_api/';
$ajaxconn = new CurlConnection($url);

/**
 * if POST is used to pick the action, prefer it. Else, check GET
 */
$actionname = '';
if(isset($_POST['actionname']))
{
    $actionname = $_POST['actionname'];
    unset($_POST['actionname']);

} else {  
	if(isset($_GET['actionname']))
	{
	  $actionname = $_GET['actionname'];
	  $pos = strpos( $actionname, "?" );
	  if($pos !== false)
	  {
	    $actionname = substr($actionname, 0, $pos);
	  }
	  unset($_GET['actionname']);
	}
}

if($actionname == 'location')
{
    echo $ajaxconn -> connect('get_location.php');
}
elseif($actionname == 'orientation')
{
    echo $ajaxconn -> connect('get_orientation.php');
}
elseif($actionname == 'geo')
{
	echo $ajaxconn -> getGeo();
}
elseif($actionname == 'account')
{
    echo $ajaxconn -> connect('tour_create_account.php');
}
elseif($actionname == 'profile')
{
    echo $ajaxconn -> connect('tour_create_profile.php');
}
?>