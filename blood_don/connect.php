 <?php
$servername = "sql200.infinityfree.com";
$username = "if0_37187524";
$password = "LlgR5gxo5dEp6lC";



$dbname = "if0_37187524_blooddonation";   // DatabaseName
$tablename = "donordatabase";
$Name = $_POST['Name'];
$address = $_POST['address'];
$gender = $_POST['gender'];
$email = $_POST['email'];
$number = $_POST['number'];
$bgroup = $_POST['bgroup'];



// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}



$sql = "INSERT INTO $tablename (Name, address, gender, email, number, bgroup)
VALUES ('$Name', '$address', '$gender','$email', '$number', '$bgroup')";

if ($conn->query($sql) === TRUE) {
  echo '<script>alert("Thank You. Details successfully updated")</script>';
  
  header( 'Location: blooddonation_thanks.html' ) ;
	
//  <script> window.location.href = 'blooddonation_thanks.html';</script>
	
} else {
  echo '<script>alert("Error: same Phone Number or Email<br>")</script>'. $conn->error;
}

$conn->close();
?> 